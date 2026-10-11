"use client";

import { Component, type ReactNode, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";

function GoldRings({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);

  useFrame(({ clock, pointer }, delta) => {
    if (!group.current || !animate) return;
    const time = clock.getElapsedTime();
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, pointer.x * 0.4, 3, delta);
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, -pointer.y * 0.2, 3, delta);
    group.current.rotation.z = Math.sin(time * 0.35) * 0.12;
    group.current.position.y = Math.sin(time * 0.8) * 0.09;
  });

  return (
    <group ref={group} rotation={[0.1, 0, -0.15]}>
      <mesh position={[-0.48, 0.12, 0]} rotation={[0.65, -0.38, 0.2]}>
        <torusGeometry args={[0.78, 0.105, 20, 80]} />
        <meshStandardMaterial color="#d7ad65" metalness={0.88} roughness={0.22} />
      </mesh>
      <mesh position={[0.45, -0.06, 0.2]} rotation={[-0.5, 0.5, -0.35]}>
        <torusGeometry args={[0.73, 0.08, 20, 80]} />
        <meshStandardMaterial color="#ebcc93" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function RingFallback() {
  return <div className="w-ring-fallback"><i /><i /></div>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <RingFallback /> : this.props.children; }
}

export default function Rings({ animate }: { animate: boolean }) {
  return (
    <SceneBoundary>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop={animate ? "always" : "demand"}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        fallback={<RingFallback />}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[3, 4, 5]} intensity={5} color="#fff8e6" />
        <directionalLight position={[-3, -1, 2]} intensity={3} color="#e0b36c" />
        <pointLight position={[0, 2, -2]} intensity={12} />
        <GoldRings animate={animate} />
      </Canvas>
    </SceneBoundary>
  );
}
