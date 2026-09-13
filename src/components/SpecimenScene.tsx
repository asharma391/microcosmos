// GLB material cloning, centering, Canvas and OrbitControls adapted from
// cclank/cell-architecture-studio (MIT). See THIRD_PARTY_NOTICES.md.
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Html,
  Line,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import {
  Box3,
  Vector3,
  Mesh,
  MeshStandardMaterial,
  Color,
  Raycaster,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { specimens, type Specimen } from "../data/specimens";

const modelUrls = specimens.map((specimen) => specimen.model);
type Props = {
  specimen: Specimen;
  autoRotate: boolean;
  surface: boolean;
  labels: boolean;
  active: number | null;
  onSelect: (n: number) => void;
  resetKey: number;
  zoom: number;
};
class SceneError extends Component<
  { children: ReactNode; image: string; resetKey: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previous: Readonly<{ resetKey: string }>) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }
  render() {
    return this.state.failed ? (
      <div className="model-error">
        <img src={this.props.image} alt="Specimen reference illustration" />
        <p>The 3D model could not load.</p>
        <button onClick={() => location.reload()}>Reload viewer</button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function Loading() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="model-loading">
        Loading specimen · {Math.round(progress)}%
      </div>
    </Html>
  );
}
function Annotation({
  part,
  index,
  color,
  anchor,
  marker,
  normal,
  active,
  onSelect,
}: {
  part: Specimen["parts"][number];
  index: number;
  color: string;
  anchor: [number, number, number];
  marker: [number, number, number];
  normal: [number, number, number];
  active: number | null;
  onSelect: (n: number) => void;
}) {
  const [occluded, setOccluded] = useState(false);
  const [backFacing, setBackFacing] = useState(false);
  const anchorVector = useMemo(() => new Vector3(...anchor), [anchor]);
  const normalVector = useMemo(() => new Vector3(...normal), [normal]);
  const toCamera = useRef(new Vector3());
  const wasBackFacing = useRef(false);
  useFrame(({ camera }) => {
    const hidden =
      toCamera.current.copy(camera.position).sub(anchorVector).dot(normalVector) <= 0;
    if (hidden !== wasBackFacing.current) {
      wasBackFacing.current = hidden;
      setBackFacing(hidden);
    }
  });
  if (backFacing) return null;
  return (
    <group>
      {!occluded && (
        <>
          <mesh position={anchor}>
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
          <Line
            points={[anchor, marker]}
            color={color}
            lineWidth={1.2}
            depthTest={false}
          />
        </>
      )}
      <Html
        position={marker}
        center
        occlude
        onOcclude={setOccluded}
        zIndexRange={[8, 0]}
      >
        <button
          aria-label={part.name}
          className={`hotspot ${active === index ? "selected" : ""}`}
          onClick={() => onSelect(index)}
        >
          0{index + 1}
        </button>
        {active === index && <div className="hotspot-label">{part.name}</div>}
      </Html>
    </group>
  );
}
function Model({ specimen, surface, labels, active, onSelect }: Props) {
  // Use the same combined cache key for every selection. The first visit loads
  // the complete collection once; subsequent switches never suspend for a GLB.
  const loadedModels = useGLTF(modelUrls);
  const scene = loadedModels[specimens.findIndex((item) => item.id === specimen.id)].scene;
  const model = useMemo(() => {
    const clone = scene.clone(true);
    if (specimen.id === "tardigrade") clone.rotation.y = -1.05;
    if (specimen.id === "diatom") clone.rotation.x = Math.PI / 2;
    if (specimen.id === "paramecium") clone.rotation.x = Math.PI / 2;
    clone.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];
      node.material = materials.map((original) => {
        const m = original.clone() as MeshStandardMaterial;
        if (surface) {
          m.map = null;
          m.color = new Color("#7f8974");
          m.metalness = 0.08;
          m.roughness = 0.67;
        } else {
          if (m.map) m.map.colorSpace = SRGBColorSpace;
          m.roughness = Math.max(m.roughness ?? 0.5, 0.42);
          m.metalness = 0;
        }
        return m;
      });
      if (node.material.length === 1) node.material = node.material[0];
      node.castShadow = false;
      node.receiveShadow = false;
    });
    const box = new Box3().setFromObject(clone),
      size = box.getSize(new Vector3());
    // Leave a little breathing room so annotations remain readable during zoom.
    const scale = 3.2 / Math.max(size.x, size.y, size.z);
    clone.scale.setScalar(scale);
    clone.updateMatrixWorld(true);
    const fittedBox = new Box3().setFromObject(clone);
    const center = fittedBox.getCenter(new Vector3());
    const halfSize = fittedBox.getSize(new Vector3()).multiplyScalar(0.5);
    clone.position.sub(center);
    clone.updateMatrixWorld(true);

    const maxHalf = Math.max(halfSize.x, halfSize.y, halfSize.z);
    const raycaster = new Raycaster();
    const anchors = specimen.parts.map((part) => {
      const candidate = new Vector3(
        (part.point[0] / 1.35) * halfSize.x,
        (part.point[1] / 1.35) * halfSize.y,
        (part.point[2] / 1.35) * halfSize.z,
      );

      // Pins are authored from the default front view. Project them onto the
      // real mesh so rotation and zoom cannot reveal a gap from the specimen.
      raycaster.set(
        new Vector3(candidate.x, candidate.y, halfSize.z + maxHalf + 0.5),
        new Vector3(0, 0, -1),
      );
      let hit = raycaster.intersectObject(clone, true)[0];
      let outward = new Vector3(0, 0, 1);
      if (!hit) {
        const radial = candidate.clone();
        if (radial.lengthSq() < 0.001) radial.set(0, 0, 1);
        radial.normalize();
        outward = radial.clone();
        raycaster.set(radial.clone().multiplyScalar(maxHalf * 3), radial.clone().negate());
        hit = raycaster.intersectObject(clone, true)[0];
      }
      let normal = outward;
      if (hit?.face) {
        normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        if (normal.dot(outward) < 0) normal.negate();
      }
      const snapped = hit?.point.clone().addScaledVector(normal, maxHalf * 0.008) ?? candidate;
      return {
        point: snapped.toArray() as [number, number, number],
        normal: normal.toArray() as [number, number, number],
      };
    });
    return { object: clone, halfSize, anchors };
  }, [scene, surface, specimen.id, specimen.parts]);
  useEffect(
    () => () => {
      model.object.traverse((n) => {
        if (n instanceof Mesh)
          (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) =>
            m.dispose(),
          );
      });
    },
    [model],
  );
  return (
    <group>
        <primitive object={model.object} />
        {labels &&
          specimen.parts.map((p, i) => {
            const anchor = model.anchors[i].point;
            const lift = Math.max(0.08, Math.min(0.18, model.halfSize.y * 0.12));
            const insetX =
              Math.abs(anchor[0]) > model.halfSize.x * 0.78
                ? -Math.sign(anchor[0]) * lift
                : 0;
            const spreadX = (i % 2 === 0 ? -1 : 1) * lift * 1.35;
            const marker: [number, number, number] = [
              anchor[0] + insetX + spreadX,
              anchor[1] + lift,
              anchor[2],
            ];
            return (
              <Annotation
                key={p.name}
                part={p}
                index={i}
                color={specimen.color}
                anchor={anchor}
                marker={marker}
                normal={model.anchors[i].normal}
                active={active}
                onSelect={onSelect}
              />
            );
          })}
    </group>
  );
}
function Controls({
  resetKey,
  zoom,
  autoRotate,
  specimenId,
}: Pick<Props, "resetKey" | "zoom" | "autoRotate"> & { specimenId: string }) {
  const ref = useRef<OrbitControlsImpl>(null);
  const { camera, invalidate } = useThree();
  const last = useRef(0);
  useEffect(() => {
    camera.position.set(specimenId === "diatom" ? -3 : 0, 0.12, specimenId === "diatom" ? 5.2 : 6);
    ref.current?.target.set(0, 0, 0);
    ref.current?.update();
    last.current = 0;
    invalidate();
  }, [resetKey, specimenId, camera, invalidate]);
  useEffect(() => {
    if (ref.current) {
      const offset = camera.position.clone().sub(ref.current.target);
      offset.multiplyScalar(Math.pow(0.82, zoom - last.current));
      camera.position.copy(ref.current.target).add(offset);
      ref.current.update();
      last.current = zoom;
      invalidate();
    }
  }, [zoom, camera, invalidate]);
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={0.7}
      enablePan={false}
      minDistance={3.7}
      maxDistance={11}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
export default function SpecimenScene(props: Props) {
  return (
    <SceneError image={props.specimen.image} resetKey={props.specimen.id}>
      <Canvas
        camera={{ position: [0, 0.12, 6], fov: 38 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
        }}
        frameloop={props.autoRotate ? "always" : "demand"}
      >
        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#fff9ec", "#adba9b", 0.7]} />
        <directionalLight position={[4, 6, 5]} intensity={2.1} />
        <directionalLight position={[-4, 2, -3]} intensity={0.85} />
        <Suspense fallback={<Loading />}>
          <Model {...props} />
          <ContactShadows
            position={[0, -1.9, 0]}
            opacity={0.12}
            scale={8}
            blur={3}
            far={4}
            resolution={256}
            frames={1}
          />
        </Suspense>
        <Controls
          resetKey={props.resetKey}
          zoom={props.zoom}
          autoRotate={props.autoRotate}
          specimenId={props.specimen.id}
        />
      </Canvas>
    </SceneError>
  );
}
