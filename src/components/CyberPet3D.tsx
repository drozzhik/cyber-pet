"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { PetState, ShopItem } from "../app/types";
import * as THREE from "three";

interface CyberPet3DProps {
  state: PetState;
  isSleeping: boolean;
  isCleaning: boolean;
  onTap: () => void;
  onReaction: (type: "head" | "body" | "turbine") => void;
  openMiniGame: () => void;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  colorClass: string;
}

// ── 3D КОМПОНЕНТЫ ТЮНИНГА ───────────────────────────────────────────────────

function CompanionDrone({ droneType }: { droneType: string | null }) {
  const droneRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!droneRef.current || !meshRef.current) return;
    const time = state.clock.getElapsedTime();
    // Орбитальное вращение вокруг питомца
    droneRef.current.rotation.y = time * (droneType === 'drone_shield' ? 2 : 1.5);
    // Вращение самого дрона
    meshRef.current.rotation.x = time * 2;
    meshRef.current.rotation.y = time * 3;
    // Легкая левитация
    meshRef.current.position.y = Math.sin(time * 3) * 0.2;
  });

  if (!droneType) return null;

  return (
    <group ref={droneRef} position={[0, 0, 0]}>
      {/* Сдвиг на радиус орбиты */}
      <group position={[1.5, 0.5, 0]}>
        {droneType === 'drone_navi' && (
          <mesh ref={meshRef} scale={[0.15, 0.15, 0.15]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#00f0ff" />
            <pointLight color="#00f0ff" intensity={2} distance={3} />
          </mesh>
        )}
        {droneType === 'drone_shield' && (
          <mesh ref={meshRef} scale={[0.2, 0.2, 0.2]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color="#ff007f" wireframe={true} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function VfxLayer({ vfxType }: { vfxType: string | null }) {
  const pointsRef = useRef<THREE.Points>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  
  const glitchCount = 40;
  const positions = useMemo(() => {
    const pos = new Float32Array(glitchCount * 3);
    for (let i = 0; i < glitchCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.5;
      pointsRef.current.rotation.x = Math.sin(time) * 0.5;
      // Jitter
      const scale = 1 + Math.sin(time * 20) * 0.1;
      pointsRef.current.scale.set(scale, scale, scale);
    }
    if (haloRef.current) {
      haloRef.current.rotation.z = time * 2;
      haloRef.current.rotation.x = Math.PI / 2 + Math.sin(time * 2) * 0.1;
      const s = 1 + Math.sin(time * 5) * 0.05;
      haloRef.current.scale.set(s, s, s);
    }
  });

  if (!vfxType) return null;

  return (
    <group position={[0, 0, 0]}>
      {vfxType === 'vfx_glitch' && (
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.08} color="#00ff00" transparent opacity={0.8} />
        </points>
      )}
      {vfxType === 'vfx_halo' && (
        <mesh ref={haloRef} position={[0, 0.8, 0]}>
          <torusGeometry args={[0.7, 0.02, 16, 100]} />
          <meshBasicMaterial color="#bc13fe" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

// 1. Неоновые небоскребы для фона "cityscape"
function CyberCityscape() {
  return (
    <group position={[0, -1.8, -6]}>
      {/* Левая башня */}
      <mesh position={[-3.5, 2.5, 0]}>
        <boxGeometry args={[1, 5, 1]} />
        <meshStandardMaterial color="#0b0b18" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[-3.5, 2.5, 0.02]}>
        <boxGeometry args={[1.02, 5.02, 1.02]} />
        <meshBasicMaterial color="#bc13fe" wireframe={true} />
      </mesh>

      {/* Центральная башня */}
      <mesh position={[0, 3.5, -1]}>
        <boxGeometry args={[1.8, 7, 1.5]} />
        <meshStandardMaterial color="#080812" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, 3.5, -0.98]}>
        <boxGeometry args={[1.82, 7.02, 1.52]} />
        <meshBasicMaterial color="#00f0ff" wireframe={true} />
      </mesh>

      {/* Правая башня */}
      <mesh position={[3.5, 2, 0.5]}>
        <boxGeometry args={[1.2, 4, 1.2]} />
        <meshStandardMaterial color="#0b0b18" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[3.5, 2, 0.52]}>
        <boxGeometry args={[1.22, 4.02, 1.22]} />
        <meshBasicMaterial color="#ff007f" wireframe={true} />
      </mesh>
    </group>
  );
}

// 2. Компонент 3D Фона (Сетка и Летающие частицы)
function CyberBackground({ decorType, bgColor }: { decorType: string | null, bgColor: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 70;

  // Цвет сетки пола и частиц в зависимости от декора
  const isDigitalRain = decorType === "digital_rain";
  const isCityscape = decorType === "cityscape";
  const isChromeGrid = decorType === "chrome_grid";

  const gridColor = isDigitalRain 
    ? "#00ff00" 
    : isChromeGrid 
    ? "#ffb700" 
    : bgColor; 

  const particleColor = isDigitalRain 
    ? "#00ff00" 
    : isChromeGrid 
    ? "#ffb700" 
    : bgColor;

  // Генерируем случайные позиции для нано-частиц
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;     // X
      pos[i * 3 + 1] = (Math.random() - 0.3) * 6; // Y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8; // Z
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.03;
    }
  });

  return (
    <group>
      {/* 3D Сетка пола */}
      <gridHelper 
        args={[30, 30, gridColor, "#121225"]} 
        position={[0, -1.8, 0]} 
      />

      {/* 3D Небоскребы при выборе фона Города */}
      {isCityscape && <CyberCityscape />}

      {/* Летающие светящиеся пылинки */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={particleColor}
          size={0.06}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// 3. Камера
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.2, 3.6);
  }, [camera]);
  return null;
}

// 4. Компонент 3D Модели питомца
interface PetModelProps {
  state: PetState;
  isSleeping: boolean;
  isCleaning: boolean;
  onClickPart: (part: "head" | "body" | "turbine", e: any) => void;
}

function PetModel({ state, isSleeping, isCleaning, onClickPart }: PetModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const laserRef = useRef<THREE.Mesh>(null);

  // Состояния для перетаскивания и анимации вращения
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  
  // Загружаем внешнюю GLB-модель кота
  const { scene } = useGLTF("/spherical_cyber-cat.glb");

  // Анимации реакций
  const flipProgress = useRef(0);
  const isFlipping = useRef(false);

  const turbineSpinRef = useRef(0);
  const isTurbineSpinning = useRef(false);
  const turbineTimer = useRef(0);

  const headReactionRef = useRef(false);
  const headTimer = useRef(0);



  const handlePartClick = (part: "head" | "body" | "turbine", e: any) => {
    if (isSleeping) return; // Во время сна питомца нельзя беспокоить

    onClickPart(part, e);

    if (part === "body" && !isFlipping.current) {
      isFlipping.current = true;
      flipProgress.current = 0;
    } else if (part === "turbine") {
      isTurbineSpinning.current = true;
      turbineTimer.current = 1.2; // Крутить турбины 1.2 секунды
    } else if (part === "head" && !headReactionRef.current) {
      headReactionRef.current = true;
      headTimer.current = 1.5; // Наклонять голову 1.5 секунды
    }
  };

  useFrame((clockState) => {
    const time = clockState.clock.getElapsedTime();
    if (!groupRef.current) return;

    // --- Инерция перетаскивания ---
    if (!isDragging.current) {
      targetRotation.current.x += (0 - targetRotation.current.x) * 0.05;
    }
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.1;
    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.1;

    if (!isSleeping) {
      if (state.equippedAnimation === 'anim_zen') {
        groupRef.current.position.y = Math.sin(time * 0.8) * 0.2;
        groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.02;
      } else if (state.equippedAnimation === 'anim_glitch') {
        groupRef.current.position.y = Math.sin(time * 2.5) * 0.12 + (Math.random() > 0.95 ? (Math.random() - 0.5) * 0.2 : 0);
        groupRef.current.rotation.z = Math.sin(time * 2) * 0.05 + (Math.random() > 0.95 ? (Math.random() - 0.5) * 0.1 : 0);
      } else {
        groupRef.current.position.y = Math.sin(time * 2.2) * 0.12;
        groupRef.current.rotation.z = Math.sin(time * 1.5) * 0.04;
      }
    } else {
      // Во время сна дрон опускается ниже и парит медленнее (глубокий сон)
      groupRef.current.position.y = -0.3 + Math.sin(time * 1.0) * 0.05;
      groupRef.current.rotation.z = 0;
    }

    // Вращение кольца
    if (ringRef.current) {
      const multiplier = isTurbineSpinning.current ? 4.0 : 1.0;
      ringRef.current.rotation.z = -time * 1.5 * multiplier;
      
      // Пульсация кольца при ускорении
      const ringScale = isTurbineSpinning.current ? 1.2 + Math.sin(time * 15) * 0.1 : 1.0;
      ringRef.current.scale.set(ringScale, ringScale, 1);
    }

    // --- Анимация кувырка (Тело) ---
    if (isFlipping.current) {
      flipProgress.current += 0.12;
      groupRef.current.rotation.x -= 0.12;

      if (flipProgress.current >= Math.PI * 2) {
        isFlipping.current = false;
        flipProgress.current = 0;
        groupRef.current.rotation.x = targetRotation.current.x;
      }
    }

    // --- Анимация турбин ---
    if (isTurbineSpinning.current) {
      turbineSpinRef.current += 0.4;
      turbineTimer.current -= 0.016;
      if (turbineTimer.current <= 0) {
        isTurbineSpinning.current = false;
      }
    }

    // --- Анимация наклона головы (Голова) ---
    if (headReactionRef.current) {
      headTimer.current -= 0.016;
      // Наклоняем голову вбок
      groupRef.current.rotation.z = 0.18 * Math.sin(time * 8);

      if (headTimer.current <= 0) {
        headReactionRef.current = false;
        groupRef.current.rotation.z = 0;
      }
    }

    // --- Движение очищающего лазера (Гигиена) ---
    if (isCleaning && laserRef.current) {
      // Движение лазера вверх-вниз от -1.0 до 1.0
      laserRef.current.position.y = Math.sin(time * 4) * 1.0;
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    (e.target as any).setPointerCapture(e.pointerId);
    isDragging.current = true;
    prevPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    const deltaX = e.clientX - prevPointer.current.x;
    const deltaY = e.clientY - prevPointer.current.y;
    targetRotation.current.y += deltaX * 0.012;
    targetRotation.current.x += deltaY * 0.012;
    targetRotation.current.x = Math.max(-0.6, Math.min(0.6, targetRotation.current.x));
    prevPointer.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    (e.target as any).releasePointerCapture(e.pointerId);
    isDragging.current = false;
  };

  // Экипированные предметы
  const hasVisor = state.equippedClothes === "visor";
  const hasJacket = state.equippedClothes === "jacket";

  let petBodyColor = state.petColor || "#5c5cba"; 
  let petMetalness = 0.1;       
  let petRoughness = 0.5;       

  if (state.equippedSkin === "magenta") {
    petBodyColor = "#ff007f";
    petMetalness = 0.1;
    petRoughness = 0.4;
  } else if (state.equippedSkin === "gold") {
    petBodyColor = "#ffb700";
    petMetalness = 0.4;
    petRoughness = 0.25;
  }

  // Клонируем сцену, центрируем и авто-масштабируем под размеры приложения
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone();
    
    // Вычисляем размеры и центр для подстройки размеров
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    // Целевая высота кота в окне - около 1.4 единиц
    const targetHeight = 1.4;
    const scaleFactor = targetHeight / (size.y || 1);
    
    // Применяем масштаб и позиционируем ровно в центре координат
    clone.scale.set(scaleFactor, scaleFactor, scaleFactor);
    clone.position.x = -center.x * scaleFactor;
    clone.position.y = -center.y * scaleFactor; // Центрируем по вертикали
    clone.position.z = -center.z * scaleFactor;

    clone.traverse((child: any) => {
      if (child.isMesh) {
        if (state.equippedSkin) {
          // Платные скины полностью перезаписывают материал
          child.material = new THREE.MeshStandardMaterial({
            color: petBodyColor,
            roughness: petRoughness,
            metalness: petMetalness,
          });
        } else if (child.material) {
          // Бесплатная покраска лишь тонирует оригинальный материал, сохраняя текстуры (глаза и тд)
          // Если материал - массив (редко, но бывает), красим первый
          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          if (mat.color) {
            mat.color.set(petBodyColor);
          }
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene, state.equippedSkin, state.petColor, petBodyColor, petRoughness, petMetalness]);

  return (
    <group 
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Анимированное кольцо лазера при очистке */}
      {isCleaning && (
        <mesh ref={laserRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.02, 8, 32]} />
          <meshBasicMaterial color="#00ff00" transparent={true} opacity={0.8} />
        </mesh>
      )}

      {/* Отрисовываем автоматически отмасштабированную GLB-модель */}
      {clonedScene && (
        <primitive 
          object={clonedScene} 
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          onClick={(e: any) => handlePartClick("body", e)}
        />
      )}

      {/* 6. Энергетическое нижнее кольцо левитации */}
      <mesh ref={ringRef} position={[0, -1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.05, 8, 32]} />
        <meshBasicMaterial 
          color={hasJacket ? "#bc13fe" : isSleeping ? "#222222" : "#00f0ff"} 
          wireframe={true} 
        />
      </mesh>

      {/* ЯДРО (Core) внутри питомца */}
      {state.equippedCore === 'core_ruby' && (
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[0.4, 0]} />
          <meshBasicMaterial color="#ff0000" wireframe={true} />
          <pointLight color="#ff0000" intensity={2} distance={2} />
        </mesh>
      )}
      {state.equippedCore === 'core_tesseract' && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI/4, Math.PI/4, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#00ffff" wireframe={true} />
          <pointLight color="#00ffff" intensity={3} distance={2} />
        </mesh>
      )}

      {/* ОТОБРАЖЕНИЕ ЭКИПИРОВКИ, ИДЕАЛЬНО ПОДСТРОЕННОЕ ПОД ГЕОМЕТРИЮ СФЕРИЧЕСКОГО КОТА */}
      {/* А. Неоновый визор (Изогнутая VR-маска, охватывающая лицо сферы) */}
      {hasVisor && (
        <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
          {/* Полутор (дуга 180 градусов), огибающий переднюю часть кота */}
          <torusGeometry args={[0.73, 0.06, 12, 32, Math.PI]} />
          <meshBasicMaterial 
            color="#ff007f" 
            transparent={true} 
            opacity={isSleeping ? 0.05 : 0.85} 
          />
        </mesh>
      )}

      {/* Б. Хромированная куртка (Цилиндрический кибер-жилет/корсет вокруг тела сферы) */}
      {hasJacket && (
        <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          {/* Открытый конический цилиндр, идеально облегающий нижнюю полусферу */}
          <cylinderGeometry args={[0.72, 0.77, 0.42, 32, 1, true]} />
          <meshStandardMaterial 
            color="#bc13fe" 
            metalness={0.9} 
            roughness={0.15} 
          />
        </mesh>
      )}

      {/* В. Головные уборы (Headwear) */}
      {state.equippedHeadwear === 'halo' && (
        <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.4, 0.04, 16, 32]} />
          <meshBasicMaterial color="#ffff00" transparent={true} opacity={0.8} />
        </mesh>
      )}
      {state.equippedHeadwear === 'ears' && (
        <group position={[0, 0.8, 0]}>
          <mesh position={[-0.4, 0.2, 0]} rotation={[0, 0, 0.4]}>
            <coneGeometry args={[0.15, 0.4, 3]} />
            <meshBasicMaterial color="#ff007f" wireframe={true} />
          </mesh>
          <mesh position={[0.4, 0.2, 0]} rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.15, 0.4, 3]} />
            <meshBasicMaterial color="#ff007f" wireframe={true} />
          </mesh>
        </group>
      )}

      {/* Г. Крылья (Wings) */}
      {state.equippedWings === 'wings_neon' && (
        <group position={[0, 0, -0.5]}>
          <mesh position={[-0.8, 0.2, 0]} rotation={[0, -0.5, 0.5]}>
            <planeGeometry args={[1.5, 0.5]} />
            <meshBasicMaterial color="#00f0ff" transparent={true} opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.8, 0.2, 0]} rotation={[0, 0.5, -0.5]}>
            <planeGeometry args={[1.5, 0.5]} />
            <meshBasicMaterial color="#00f0ff" transparent={true} opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      {state.equippedWings === 'wings_mech' && (
        <group position={[0, 0, -0.6]}>
          <mesh position={[-0.6, 0.1, 0]} rotation={[0, -0.4, 0.3]}>
            <boxGeometry args={[1.2, 0.1, 0.4]} />
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0.6, 0.1, 0]} rotation={[0, 0.4, -0.3]}>
            <boxGeometry args={[1.2, 0.1, 0.4]} />
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* Д. Двигатели (Thrusters) */}
      {state.equippedThruster === 'thruster_ion' && (
        <mesh position={[0, -1.0, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.3, 0.8, 16]} />
          <meshBasicMaterial color="#0088ff" transparent={true} opacity={0.7} />
        </mesh>
      )}
      {state.equippedThruster === 'thruster_plasma' && (
        <group position={[0, -0.9, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.05, 16, 32]} />
            <meshBasicMaterial color="#bc13fe" transparent={true} opacity={0.8} />
          </mesh>
          <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.05, 16, 32]} />
            <meshBasicMaterial color="#bc13fe" transparent={true} opacity={0.6} />
          </mesh>
          <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1, 0.05, 16, 32]} />
            <meshBasicMaterial color="#bc13fe" transparent={true} opacity={0.4} />
          </mesh>
        </group>
      )}

      {/* Е. Платформа (Base) */}
      {state.equippedBase === 'base_charge' && (
        <mesh position={[0, -1.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.3, 0.2, 32]} />
          <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.5} />
          <mesh position={[0, 0.11, 0]}>
            <ringGeometry args={[0.9, 1.1, 32]} />
            <meshBasicMaterial color="#00ff00" side={THREE.DoubleSide} />
          </mesh>
        </mesh>
      )}
      {state.equippedBase === 'base_holo' && (
        <mesh position={[0, -1.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.0, 0.1, 6]} />
          <meshBasicMaterial color="#00f0ff" wireframe={true} transparent={true} opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// 5. Главный компонент 3D Сцены
export default function CyberPet3D({
  state,
  isSleeping,
  isCleaning,
  onTap,
  onReaction,
  openMiniGame,
}: CyberPet3DProps) {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Дополнительный интервал для всплытия Zzz во время сна
  useEffect(() => {
    if (!isSleeping) return;

    const zzzInterval = setInterval(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      const newZzz: FloatingText = {
        id: Date.now() + Math.random(),
        x: rect.width / 2 + (Math.random() - 0.5) * 40,
        y: rect.height / 3 + (Math.random() - 0.5) * 20,
        text: "Zzz...",
        colorClass: "text-cyber-purple glow-purple text-sm font-bold font-mono",
      };

      setFloatingTexts((prev) => [...prev, newZzz]);

      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((t) => t.id !== newZzz.id));
      }, 1500);
    }, 1200);

    return () => clearInterval(zzzInterval);
  }, [isSleeping]);

  const handlePartClick = (part: "head" | "body" | "turbine", e: any) => {
    if (isSleeping) return;

    // Вызываем колбек реакции для начисления Fun/XP/Coins в page.tsx
    onReaction(part);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let popupText = "+3";
    let color = "text-cyber-cyan glow-cyan text-lg font-black font-orbitron";

    if (part === "head") {
      popupText = "💖 МУРР (+5 Fun)";
      color = "text-cyber-magenta glow-magenta text-xs font-bold font-mono";
    } else if (part === "turbine") {
      popupText = "⚡ РАЗГОН (+5 Coins)";
      color = "text-cyber-cyan glow-cyan text-xs font-bold font-mono";
    } else if (part === "body") {
      popupText = "🤸 САЛЬТО (+3 Coins)";
      color = "text-white glow-purple text-xs font-bold font-mono";
    }

    const newText: FloatingText = {
      id: Date.now() + Math.random(),
      x,
      y,
      text: popupText,
      colorClass: color,
    };

    setFloatingTexts((prev) => [...prev, newText]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== newText.id));
    }, 1000);
  };

  return (
    <div className="relative w-full h-full cursor-grab active:cursor-grabbing">
      <div
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden transition-all duration-700 ${
          isSleeping ? "filter brightness-[0.35] saturate-50" : ""
        }`}
      >
        <Canvas gl={{ antialias: true }} style={{ background: "transparent" }}>
          <fog attach="fog" args={["#050308", 3, 8]} />

          <ambientLight intensity={isSleeping ? 0.4 : 2.2} />
          <pointLight position={[4, 3, 4]}  intensity={isSleeping ? 1.0 : 22.0} color="#B794F4" />
          <pointLight position={[-4,-2,-4]} intensity={isSleeping ? 0.5 : 16.0} color="#76E4F7" />
          <directionalLight position={[0, 5, 2]} intensity={isSleeping ? 0.2 : 5.0} color="#ffffff" />

          <CameraSetup />

          <Suspense fallback={null}>
            <PetModel
              state={state}
              isSleeping={isSleeping}
              isCleaning={isCleaning}
              onClickPart={handlePartClick}
            />
          </Suspense>

          <VfxLayer vfxType={state.equippedVfx} />
          <CompanionDrone droneType={state.equippedDrone} />
          
          <CyberBackground decorType={state.equippedDecor} bgColor={state.bgAccentColor} />
        </Canvas>

        {/* Тонкий сканирующий луч */}
        {!isSleeping && (
          <div className="absolute left-0 w-full h-[1px] bg-holo/25 shadow-[0_0_6px_rgba(183,148,244,0.4)] animate-[bounce_8s_ease-in-out_infinite] pointer-events-none z-10" />
        )}

        {/* Всплывающий текст-попап */}
        {floatingTexts.map((text) => (
          <span
            key={text.id}
            className={`absolute select-none pointer-events-none z-20 ${text.colorClass}`}
            style={{
              left: text.x - 20,
              top:  text.y - 20,
              animation: "floatUpAndFade 1.2s ease-out forwards",
            }}
          >
            {text.text}
          </span>
        ))}
      </div>
    </div>
  );
}

useGLTF.preload("/spherical_cyber-cat.glb");