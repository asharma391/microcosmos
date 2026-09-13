// GLB material cloning, centering, Canvas and OrbitControls adapted from
// cclank/cell-architecture-studio (MIT). See THIRD_PARTY_NOTICES.md.
import {
  Component,
  Suspense,
  useCallback,
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
  Vector3,
  Mesh,
  MeshStandardMaterial,
  Color,
  SRGBColorSpace,
  ACESFilmicToneMapping,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { specimens, type Specimen } from "../data/specimens";
import { modelGeometry } from "../data/modelGeometry";

const modelUrls = specimens.map((specimen) => specimen.model);

function runWhenIdle(task: () => void) {
  let idleId: number | undefined;
  const delayId = setTimeout(() => {
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(task, { timeout: 2000 });
    } else {
      task();
    }
  }, 80);
  return () => {
    clearTimeout(delayId);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
  };
}
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

function WarmModel({ url, onReady }: { url: string; onReady: () => void }) {
  useGLTF(url);
  useEffect(() => runWhenIdle(onReady), [onReady, url]);
  return null;
}

function CollectionBootstrap({
  current,
  onComplete,
}: {
  current: string;
  onComplete: () => void;
}) {
  const queue = useRef([
    current,
    ...modelUrls.filter((url) => url !== current),
  ]);
  const [index, setIndex] = useState(0);
  const advance = useCallback(() => setIndex((value) => value + 1), []);
  useEffect(() => {
    if (index >= queue.current.length) onComplete();
  }, [index, onComplete]);
  const url = queue.current[index];
  return (
    <>
      {url && (
        <Suspense fallback={null}>
          <WarmModel url={url} onReady={advance} />
        </Suspense>
      )}
      {index < queue.current.length && (
        <Html center>
          <div className="model-loading">
            Preparing collection · {index + 1}/{queue.current.length}
          </div>
        </Html>
      )}
    </>
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
      <Html
        position={marker}
        center
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
function Model({
  specimen,
  surface,
  labels,
  active,
  onSelect,
  visible,
}: Props & { visible: boolean }) {
  const { scene } = useGLTF(specimen.model);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const geometry = modelGeometry[specimen.id];
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
    clone.scale.setScalar(geometry.scale);
    clone.position.fromArray(geometry.position);
    clone.updateMatrixWorld(true);
    return {
      object: clone,
      halfSize: new Vector3(...geometry.halfSize),
      anchors: geometry.anchors,
    };
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
    <group visible={visible}>
        <primitive object={model.object} />
        {visible && labels &&
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
  const [collectionReady, setCollectionReady] = useState(false);
  const finishBootstrap = useCallback(() => setCollectionReady(true), []);
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
        frameloop={collectionReady && props.autoRotate ? "always" : "demand"}
      >
        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#fff9ec", "#adba9b", 0.7]} />
        <directionalLight position={[4, 6, 5]} intensity={2.1} />
        <directionalLight position={[-4, 2, -3]} intensity={0.85} />
        <CollectionBootstrap
          current={props.specimen.model}
          onComplete={finishBootstrap}
        />
        {collectionReady && (
          <>
            <Suspense fallback={<Loading />}>
              {specimens.map((specimen) => (
                <Model
                  {...props}
                  key={specimen.id}
                  specimen={specimen}
                  visible={specimen.id === props.specimen.id}
                />
              ))}
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
          </>
        )}
      </Canvas>
    </SceneError>
  );
}
