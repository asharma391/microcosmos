// GLB material cloning, centering, Canvas and OrbitControls adapted from
// cclank/cell-architecture-studio (MIT). See THIRD_PARTY_NOTICES.md.
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
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
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Specimen } from "../data/specimens";
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
  { children: ReactNode; image: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
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
function Model({ specimen, surface, labels, active, onSelect }: Props) {
  const { scene } = useGLTF(specimen.model);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    if (specimen.id === "tardigrade") clone.rotation.y = -1.05;
    if (specimen.id === "diatom") clone.rotation.x = -1;
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
    const scale = 3.4 / Math.max(size.x, size.y, size.z);
    clone.scale.setScalar(scale);
    clone.updateMatrixWorld(true);
    const fittedBox = new Box3().setFromObject(clone);
    const center = fittedBox.getCenter(new Vector3());
    const halfSize = fittedBox.getSize(new Vector3()).multiplyScalar(0.5);
    clone.position.sub(center);
    return { object: clone, halfSize };
  }, [scene, surface, specimen.id]);
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
            const anchor: [number, number, number] = [
              (p.point[0] / 1.35) * model.halfSize.x,
              (p.point[1] / 1.35) * model.halfSize.y,
              (p.point[2] / 1.35) * model.halfSize.z,
            ];
            const lift = Math.max(0.08, Math.min(0.18, model.halfSize.y * 0.12));
            const marker: [number, number, number] = [
              anchor[0],
              anchor[1] + lift,
              anchor[2],
            ];
            return (
              <group key={p.name}>
                <mesh position={anchor}>
                  <sphereGeometry args={[0.025, 12, 12]} />
                  <meshBasicMaterial color={specimen.color} depthTest={false} />
                </mesh>
                <Line
                  points={[anchor, marker]}
                  color={specimen.color}
                  lineWidth={1.2}
                  depthTest={false}
                />
                <Html position={marker} center zIndexRange={[8, 0]}>
                  <button
                    aria-label={p.name}
                    className={`hotspot ${active === i ? "selected" : ""}`}
                    onClick={() => onSelect(i)}
                  >
                    0{i + 1}
                  </button>
                  {active === i && <div className="hotspot-label">{p.name}</div>}
                </Html>
              </group>
            );
          })}
    </group>
  );
}
function Controls({
  resetKey,
  zoom,
  autoRotate,
}: Pick<Props, "resetKey" | "zoom" | "autoRotate">) {
  const ref = useRef<OrbitControlsImpl>(null);
  const { camera, invalidate } = useThree();
  const last = useRef(0);
  useEffect(() => {
    camera.position.set(0, 0.12, 6);
    ref.current?.target.set(0, 0, 0);
    ref.current?.update();
    last.current = 0;
    invalidate();
  }, [resetKey, camera, invalidate]);
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
      minDistance={2.2}
      maxDistance={11}
      enableDamping
      dampingFactor={0.08}
    />
  );
}
export default function SpecimenScene(props: Props) {
  return (
    <SceneError key={props.specimen.id} image={props.specimen.image}>
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
        />
      </Canvas>
    </SceneError>
  );
}
