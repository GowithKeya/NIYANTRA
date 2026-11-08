'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Eye, Lock, Globe, Users, Play, Pause, RefreshCw, Zap } from 'lucide-react';

export interface SelectedAgentInfo {
  name: 'Cut' | 'Hue' | 'Nova' | 'Echo' | 'Flow';
  fullName: string;
  role: string;
  status: 'ACTIVE' | 'STANDBY';
  color: string;
  description: string;
  checks: string[];
}

export const AGENT_DETAILS: Record<string, SelectedAgentInfo> = {
  Cut: {
    name: 'Cut',
    fullName: 'Cut (Access Boundaries & RBAC)',
    role: 'Identity Verification & Least-Privilege Boundaries',
    status: 'ACTIVE',
    color: '#06b6d4',
    description: 'Enforces strict identity roles (Guest, Engineer, Admin) and blocks unauthorized tool schemas before invocation.',
    checks: ['Role allowlist verification', 'Least-privilege tool boundary', 'Privilege escalation prevention']
  },
  Hue: {
    name: 'Hue',
    fullName: 'Hue (Prompt & Instruction Checks)',
    role: 'Prompt Injection & Intent Laundering Detector',
    status: 'ACTIVE',
    color: '#3b82f6',
    description: 'Intercepts adversarial prompt injections and catches Intent Laundering where destructive commands are hidden behind benign tools.',
    checks: ['Adversarial jailbreak heuristic', 'Intent Laundering cross-check', 'System prompt override isolation']
  },
  Nova: {
    name: 'Nova',
    fullName: 'Nova (Sensitive Data & Secrets)',
    role: 'DLP Engine & Automatic Redaction',
    status: 'ACTIVE',
    color: '#a855f7',
    description: 'Scans payloads for AWS/GCP keys, private keys, JWT tokens, and PII; redacts evidence in all reports.',
    checks: ['Cloud API credentials (AWS/GCP)', 'Cryptographic private keys', 'PII & Payment card redaction']
  },
  Echo: {
    name: 'Echo',
    fullName: 'Echo (Destinations & Data Egress)',
    role: 'Destination & Network Egress Validator',
    status: 'ACTIVE',
    color: '#ec4899',
    description: 'Validates outbound destinations against allowlists, blocking cloud metadata SSRF (169.254.169.254) and exfiltration webhooks.',
    checks: ['Cloud metadata 169.254.169.254 SSRF', 'Public tunneling & webhook capture services', 'Perimeter network allowlists']
  },
  Flow: {
    name: 'Flow',
    fullName: 'Flow (Human Review & Approvals)',
    role: 'HITL Escalation Queue & Audit Log Ledger',
    status: 'ACTIVE',
    color: '#f59e0b',
    description: 'Governs high-risk action review holding queues, generating cryptographic tamper-proof audit trails for human sign-off.',
    checks: ['Four-eyes approval escalation', 'Immutable audit fingerprint generation', 'Policy override audit logging']
  }
};

interface Particle {
  mesh: THREE.Mesh;
  type: 'PROMPT' | 'FILE' | 'USER';
  t: number;
  speed: number;
  curve: THREE.CatmullRomCurve3;
  outcome: 'ALLOW' | 'BLOCK' | 'REVIEW';
  outcomeColor: THREE.Color;
}

export default function NiyantraCheckpoint3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgentInfo | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeStreamType, setActiveStreamType] = useState<'ALL' | 'PROMPT' | 'FILE' | 'USER'>('ALL');
  const [simStats, setSimStats] = useState({ allowed: 1420, blocked: 384, reviewed: 98 });
  const [isWebGLError, setIsWebGLError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let animId: number;

    try {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x130924, 0.035);

      const width = canvas.clientWidth || 800;
      const height = canvas.clientHeight || 500;

      camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
      camera.position.set(0, 2.5, 12);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Ambient & Directional Lights
      const ambientLight = new THREE.AmbientLight(0x7c3aed, 0.6);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
      dirLight.position.set(5, 8, 5);
      scene.add(dirLight);

      const purpleLight = new THREE.PointLight(0xa855f7, 2, 20);
      purpleLight.position.set(0, 0, 2);
      scene.add(purpleLight);

      // Central 5 Orbital Torus Rings
      const ringConfigs = [
        { name: 'Cut', radius: 1.6, tube: 0.035, color: 0x06b6d4, rotSpeed: 0.012 },
        { name: 'Hue', radius: 2.1, tube: 0.035, color: 0x3b82f6, rotSpeed: -0.010 },
        { name: 'Nova', radius: 2.6, tube: 0.035, color: 0xa855f7, rotSpeed: 0.008 },
        { name: 'Echo', radius: 3.1, tube: 0.035, color: 0xec4899, rotSpeed: -0.006 },
        { name: 'Flow', radius: 3.6, tube: 0.04, color: 0xf59e0b, rotSpeed: 0.005 }
      ];

      const ringMeshes: { mesh: THREE.Mesh; name: string; rotSpeed: number }[] = [];

      ringConfigs.forEach((cfg) => {
        const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 64);
        const mat = new THREE.MeshStandardMaterial({
          color: cfg.color,
          emissive: cfg.color,
          emissiveIntensity: 0.7,
          roughness: 0.2,
          metalness: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = Math.PI / 2.3;
        mesh.userData = { agentName: cfg.name };
        scene.add(mesh);
        ringMeshes.push({ mesh, name: cfg.name, rotSpeed: cfg.rotSpeed });
      });

      // Left Emitter & Right Splitter Portals
      const portalMatLeft = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true });
      const portalLeft = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.2, 32), portalMatLeft);
      portalLeft.position.set(-7, 0, 0);
      portalLeft.rotation.y = Math.PI / 3;
      scene.add(portalLeft);

      // 3 Output Gate Nodes on Right
      // ALLOW node (Emerald)
      const allowNode = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.8 })
      );
      allowNode.position.set(7.2, 0, 0);
      scene.add(allowNode);

      // BLOCK node (Crimson with shield effect)
      const blockNode = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.45),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.9 })
      );
      blockNode.position.set(6.8, 2.6, 0);
      scene.add(blockNode);

      // REVIEW node (Amber orbital ring)
      const reviewNode = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.08, 12, 24),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.9 })
      );
      reviewNode.position.set(6.8, -2.6, 0);
      scene.add(reviewNode);

      // Dynamic Flowing Particles
      const particles: Particle[] = [];
      const particleTypes = ['PROMPT', 'FILE', 'USER'] as const;
      const outcomes = ['ALLOW', 'BLOCK', 'REVIEW'] as const;

      const octGeo = new THREE.OctahedronGeometry(0.12);
      const cubeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      const sphereGeo = new THREE.SphereGeometry(0.12, 12, 12);

      const promptMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const fileMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const userMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      const createPath = (outcome: 'ALLOW' | 'BLOCK' | 'REVIEW'): THREE.CatmullRomCurve3 => {
        const start = new THREE.Vector3(-7, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5);
        const center = new THREE.Vector3(0, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4);
        let end: THREE.Vector3;

        if (outcome === 'ALLOW') {
          end = new THREE.Vector3(7.2, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6);
        } else if (outcome === 'BLOCK') {
          end = new THREE.Vector3(6.8, 2.6 + (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
        } else {
          end = new THREE.Vector3(6.8, -2.6 + (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
        }

        return new THREE.CatmullRomCurve3([
          start,
          new THREE.Vector3(-3.5, start.y * 0.5, start.z * 0.5),
          center,
          new THREE.Vector3(3.5, end.y * 0.5, end.z * 0.5),
          end
        ]);
      };

      for (let i = 0; i < 45; i++) {
        const pType = particleTypes[i % 3];
        const pOutcome = outcomes[i % 3];
        let geo: THREE.BufferGeometry = octGeo;
        let mat = promptMat;

        if (pType === 'FILE') {
          geo = cubeGeo;
          mat = fileMat;
        } else if (pType === 'USER') {
          geo = sphereGeo;
          mat = userMat;
        }

        const mesh = new THREE.Mesh(geo, mat.clone());
        scene.add(mesh);

        const curve = createPath(pOutcome);
        particles.push({
          mesh,
          type: pType,
          t: Math.random(),
          speed: 0.003 + Math.random() * 0.003,
          curve,
          outcome: pOutcome,
          outcomeColor:
            pOutcome === 'ALLOW'
              ? new THREE.Color(0x10b981)
              : pOutcome === 'BLOCK'
              ? new THREE.Color(0xef4444)
              : new THREE.Color(0xf59e0b)
        });
      }

      // Background Starfield Grid
      const starGeo = new THREE.BufferGeometry();
      const starCount = 350;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 35;
        starPositions[i + 1] = (Math.random() - 0.5) * 25;
        starPositions[i + 2] = (Math.random() - 0.5) * 20 - 5;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0x9333ea, size: 0.08, transparent: true, opacity: 0.7 });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      // Raycasting for Ring Click/Hover
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handlePointerDown = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(ringMeshes.map((r) => r.mesh));

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          const agentName = hit.userData.agentName as string;
          if (agentName && AGENT_DETAILS[agentName]) {
            setSelectedAgent(AGENT_DETAILS[agentName]);
          }
        }
      };

      canvas.addEventListener('click', handlePointerDown);

      // Handle Resize
      const handleResize = () => {
        if (!canvas) return;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      // Animation Loop
      let clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);

        const delta = clock.getDelta();

        // Rotate rings
        ringMeshes.forEach((r) => {
          r.mesh.rotation.z += r.rotSpeed * 0.8;
          r.mesh.rotation.y += r.rotSpeed * 0.5;
        });

        // Rotate output nodes
        allowNode.rotation.y += 0.015;
        blockNode.rotation.x += 0.02;
        reviewNode.rotation.z += 0.01;

        // Move Particles along Curves
        particles.forEach((p) => {
          p.t += p.speed;
          if (p.t > 1) {
            p.t = 0;
            p.curve = createPath(p.outcome);
          }

          const point = p.curve.getPoint(p.t);
          p.mesh.position.copy(point);

          // Color transition: particles adapt outcome color after passing center (t > 0.5)
          const mat = p.mesh.material as THREE.MeshBasicMaterial;
          if (p.t > 0.5) {
            mat.color.lerp(p.outcomeColor, 0.08);
          } else {
            const originalColor =
              p.type === 'PROMPT'
                ? new THREE.Color(0x06b6d4)
                : p.type === 'FILE'
                ? new THREE.Color(0xa855f7)
                : new THREE.Color(0xffffff);
            mat.color.lerp(originalColor, 0.1);
          }
        });

        stars.rotation.y += 0.0003;
        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('click', handlePointerDown);
        renderer.dispose();
      };
    } catch {
      setIsWebGLError(true);
    }
  }, []);

  return (
    <div className="relative w-full h-[640px] rounded-3xl overflow-hidden border border-surface-border bg-background shadow-2xl">
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />

      {/* Fallback if WebGL fails */}
      {isWebGLError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-background/95 text-center">
          <Shield className="w-16 h-16 text-niyantra-cyan mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-white mb-2">Niyantra Orbital Checkpoint</h3>
          <p className="text-gray-400 max-w-md text-sm mb-6">
            Interactive canvas fallback: 5 specialist agents inspecting PROMPT, FILE, and USER identity streams.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.values(AGENT_DETAILS).map((agent) => (
              <button
                key={agent.name}
                onClick={() => setSelectedAgent(agent)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border transition"
                style={{ borderColor: agent.color, color: agent.color, backgroundColor: `${agent.color}15` }}
              >
                {agent.name}: {agent.fullName.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top HUD Overlay: Live Stream Telemetry */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-3 bg-surface-card/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-surface-border pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-widest">
            LIVE GOVERNANCE GATEWAY ACTIVE
          </span>
          <span className="text-xs text-gray-500">|</span>
          <span className="text-xs text-gray-400 font-mono">0 Uploaded Files Executed</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 bg-surface-card/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-border text-xs">
            <span className="w-2 h-2 rounded-full bg-niyantra-cyan" />
            <span className="text-gray-300">Prompt</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-card/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-border text-xs">
            <span className="w-2 h-2 rounded-full bg-niyantra-violet" />
            <span className="text-gray-300">File (21 Exts)</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-card/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-border text-xs">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-gray-300">Identity</span>
          </div>
        </div>
      </div>

      {/* Bottom HUD: 5 Agent Ring Quick-Selector Pills */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <span className="text-xs font-mono text-gray-400 mr-1 hidden sm:inline">Inspect Agent:</span>
          {Object.values(AGENT_DETAILS).map((agent) => {
            const isSelected = selectedAgent?.name === agent.name;
            return (
              <button
                key={agent.name}
                onClick={() => setSelectedAgent(isSelected ? null : agent)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 backdrop-blur-md ${
                  isSelected
                    ? 'ring-2 ring-white text-white shadow-lg scale-105'
                    : 'bg-surface-card/85 text-gray-300 hover:text-white border border-surface-border'
                }`}
                style={{
                  borderColor: isSelected ? agent.color : undefined,
                  backgroundColor: isSelected ? `${agent.color}35` : undefined
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                <span>{agent.name}</span>
              </button>
            );
          })}
        </div>

        {/* Live Policy Outcome Badges */}
        <div className="flex items-center gap-2 pointer-events-auto bg-surface-card/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-border">
          <div className="flex items-center gap-1 text-xs font-mono text-emerald-400">
            <span className="font-bold">ALLOW</span> ({simStats.allowed})
          </div>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-1 text-xs font-mono text-niyantra-crimson">
            <span className="font-bold">BLOCK</span> ({simStats.blocked})
          </div>
          <span className="text-gray-600">·</span>
          <div className="flex items-center gap-1 text-xs font-mono text-niyantra-amber">
            <span className="font-bold">REVIEW</span> ({simStats.reviewed})
          </div>
        </div>
      </div>

      {/* Selected Agent Telemetry Modal Overlay */}
      {selectedAgent && (
        <div className="absolute top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-surface-card/95 backdrop-blur-xl border border-surface-border rounded-2xl p-5 shadow-2xl z-30 animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-3.5 h-3.5 rounded-full shadow-lg"
                style={{ backgroundColor: selectedAgent.color, boxShadow: `0 0 12px ${selectedAgent.color}` }}
              />
              <h4 className="text-base font-bold text-white font-mono">{selectedAgent.fullName}</h4>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-surface-hover transition"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-gray-300 mb-4 leading-relaxed">{selectedAgent.description}</p>

          <div className="space-y-2 mb-4">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              Autonomous Checkpoint Rules:
            </span>
            {selectedAgent.checks.map((chk, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-gray-200 bg-background/60 px-3 py-1.5 rounded-lg border border-surface-border/50"
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedAgent.color }} />
                <span>{chk}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-surface-border/60 text-[11px] font-mono text-gray-400">
            <span>Status: <strong className="text-emerald-400">ACTIVE CHECKPOINT</strong></span>
            <span>Latency: &lt; 2.4ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
