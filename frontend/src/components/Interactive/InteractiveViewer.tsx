import React, { useRef, useState } from 'react';
import { Typography, Button, Tag } from 'antd';
import {
  ExperimentOutlined, ExpandOutlined, PlayCircleFilled, Loading3QuartersOutlined,
} from '@ant-design/icons';
import type { Interactive } from '../../types';

const { Text } = Typography;

const SOURCE_LABELS: [string, string][] = [
  ['sketchfab.com', 'Sketchfab'],
  ['phet.colorado.edu', 'PhET'],
  ['javalab.org', 'JavaLab'],
  ['biologysimulations.com', 'Biology Simulations'],
  ['labxchange.org', 'LabXchange'],
  ['si.edu', 'Smithsonian 3D'],
  ['biodigital.com', 'BioDigital'],
  ['youtube', 'YouTube'],
];

function sourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SOURCE_LABELS.find(([d]) => host.includes(d))?.[1] || host;
  } catch { return ''; }
}

/* Sketchfab bosilganda darhol ishga tushishi uchun autostart parametri qo'shiladi */
function startUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.toLowerCase().includes('sketchfab.com')) u.searchParams.set('autostart', '1');
    return u.toString();
  } catch { return url; }
}

/* Tashqi interaktiv resurs kartasi. Iframe faqat foydalanuvchi bosgandagina
   yuklanadi — sahifa tez ochiladi, bir nechta og'ir model bir-biriga xalaqit bermaydi */
const InteractiveCard: React.FC<{ item: Interactive }> = ({ item }) => {
  const [loaded, setLoaded] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const frameWrapRef = useRef<HTMLDivElement>(null);

  const goFullscreen = () => {
    if (!loaded) setLoaded(true);
    frameWrapRef.current?.requestFullscreen?.().catch(() => {});
  };

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--leaf-radius)', padding: '20px 20px 16px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ExperimentOutlined />
        </span>
        <Text strong style={{ fontSize: 16, color: 'var(--ink)', flex: 1, minWidth: 160 }}>{item.title}</Text>
        <Tag color="green" style={{ margin: 0 }}>{sourceLabel(item.embedUrl)}</Tag>
      </div>

      <div
        ref={frameWrapRef}
        style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)', background: '#0a1628' }}
      >
        {loaded ? (
          <>
            {!frameReady && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 15, gap: 10 }}>
                <Loading3QuartersOutlined spin /> Yuklanmoqda...
              </div>
            )}
            <iframe
              title={item.title}
              src={startUrl(item.embedUrl)}
              onLoad={() => setFrameReady(true)}
              style={{ width: '100%', height: '100%', aspectRatio: '16 / 9', minHeight: 280, border: 0, display: 'block', position: 'relative' }}
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
            />
          </>
        ) : (
          <button
            onClick={() => setLoaded(true)}
            style={{
              width: '100%', aspectRatio: '16 / 9', minHeight: 280, border: 0, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
              background: 'radial-gradient(ellipse at center, #14304d 0%, #0a1628 75%)', color: '#fff',
            }}
          >
            <PlayCircleFilled style={{ fontSize: 58, color: '#2fb56b', filter: 'drop-shadow(0 4px 14px rgba(47,181,107,0.45))' }} />
            <span style={{ fontSize: 15.5, fontWeight: 700 }}>Ochish va boshqarish</span>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>Sichqoncha bilan aylantiring · scroll — zoom</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        {item.description
          ? <Text style={{ color: 'var(--muted)', fontSize: 13.5, flex: 1, minWidth: 200 }}>{item.description}</Text>
          : <span style={{ flex: 1 }} />}
        <Button size="small" icon={<ExpandOutlined />} onClick={goFullscreen} style={{ flexShrink: 0 }}>
          To'liq ekran
        </Button>
      </div>
    </section>
  );
};

const InteractiveViewer: React.FC<{ items: Interactive[] }> = ({ items }) => {
  if (!items.length) return null;
  return <div>{items.map(i => <InteractiveCard key={i.id} item={i} />)}</div>;
};

export default InteractiveViewer;
