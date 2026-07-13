import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Stage } from '@react-three/drei';
import { Typography } from 'antd';

const { Text } = Typography;

const Model = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
};

interface Props {
  url: string;
  height?: number;
}

const Model3DViewer: React.FC<Props> = ({ url, height = 400 }) => (
  <div style={{ height, borderRadius: 16, overflow: 'hidden', background: '#0a1628', border: '1px solid var(--line)' }}>
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <Suspense fallback={null}>
        <Stage environment="city" intensity={0.6}>
          <Model url={url} />
        </Stage>
        <OrbitControls autoRotate autoRotateSpeed={1.5} enableZoom enablePan={false} />
        <Environment preset="forest" />
      </Suspense>
    </Canvas>
    <div style={{ textAlign: 'center', padding: '8px 0', background: 'rgba(0,0,0,0.5)' }}>
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>🖱️ Sichqoncha bilan aylantiring • Scroll — zoom</Text>
    </div>
  </div>
);

export default Model3DViewer;
