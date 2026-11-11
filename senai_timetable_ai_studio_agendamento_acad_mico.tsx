import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Calendar, Users, UserCheck, DoorOpen, BookOpen, Cpu, RefreshCw, 
  CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Sparkles, Filter, 
  Plus, Trash2, Edit3, Save, Download, Printer, Layers, Clock, Settings2,
  ChevronRight, Info, Check, ArrowRight, Undo2, Redo2, FileSpreadsheet, 
  Upload, FileText, Sliders, PieChart, BarChart3, Move, Eye, Building2, Wrench, ShieldCheck, Award, GraduationCap, MapPin
} from 'lucide-react';

// --- DEPARTAMENTOS REGIONAIS E UNIDADES SENAI ---
const SENAI_REGIONALS = [
  { id: 'DR-CE', name: 'SENAI DR Ceará' },
  { id: 'DR-SP', name: 'SENAI DR São Paulo' },
  { id: 'DR-BA', name: 'SENAI DR Bahia' },
  { id: 'DR-MG', name: 'SENAI DR Minas Gerais' },
  { id: 'DR-SC', name: 'SENAI DR Santa Catarina' },
  { id: 'DR-PR', name: 'SENAI DR Paraná' }
];

const SENAI_UNITS = [
  // SENAI DR Ceará
  { id: 'unit-[#005A9C]jacarecanga', regionalId: 'DR-CE', name: 'SENAI Jacarecanga (CFP Waldyr Diogo)', code: 'CFP-101' },
  { id: 'unit-[#005A9C]maracanau', regionalId: 'DR-CE', name: 'SENAI Maracanaú (CFP Edilson Távora)', code: 'CFP-102' },
  { id: 'unit-barra', regionalId: 'DR-CE', name: 'SENAI Barra do Ceará (CFP Antonio Urbano)', code: 'CFP-103' },
  { id: 'unit-mucuripe', regionalId: 'DR-CE', name: 'SENAI Mucuripe (CFP José de Alencar)', code: 'CFP-104' },
  { id: 'unit-[#005A9C]horizonte', regionalId: 'DR-CE', name: 'SENAI Horizonte (CFP Eurípedes Ferreira)', code: 'CFP-105' },
  { id: 'unit-juazeiro', regionalId: 'DR-CE', name: 'SENAI Juazeiro do Norte (CFP Mário Dedé)', code: 'CFP-106' },
  { id: 'unit-sobral', regionalId: 'DR-CE', name: 'SENAI Sobral (CFP Raimundo Viana)', code: 'CFP-107' },
  { id: 'unit-ist-ce', regionalId: 'DR-CE', name: 'Faculdade SENAI Ceará / IST Eficiência Energética', code: 'IST-001' },
  // Outros DRs
  { id: 'unit-cimatec', regionalId: 'DR-BA', name: 'SENAI CIMATEC (Salvador)', code: 'CFP-001' },
  { id: 'unit-vm', regionalId: 'DR-SP', name: 'SENAI Vila Mariana (São Paulo)', code: 'CFP-102' },
  { id: 'unit-itauna', regionalId: 'DR-MG', name: 'SENAI Itaúna (CEDETEM)', code: 'CFP-305' }
];

// --- MODALIDADES EDUCACIONAIS ---
const MODALIDADES = [
  { id: 'all', name: 'Todas as Modalidades', badgeColor: 'bg-slate-700 text-slate-100' },
  { id: 'medio', name: 'Ensino Médio Integrado (SESI/SENAI)', badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' },
  { id: 'tecnico', name: 'Curso Técnico Subsequente / Concomitante', badgeColor: 'bg-sky-950/80 text-sky-300 border-sky-700/50' },
  { id: 'graduacao', name: 'Graduação Tecnológica (Superior)', badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-700/50' },
  { id: 'engenharia', name: 'Engenharia / Bacharelado Industrial', badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-700/50' },
  { id: 'aprendizagem', name: 'Aprendizagem Industrial', badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50' }
];

const EIXOS_TECNOLOGICOS = [
  "Energias Renováveis & Hidrogênio Verde (H2V)",
  "Automação e Mecatrônica",
  "Metalmecânica & Caldeiraria",
  "Têxtil, Confecção e Moda",
  "Eletroeletrônica",
  "Tecnologia da Informação & Cibersegurança",
  "Engenharia & Tecnologias Avançadas",
  "Formação Geral (BNCC SESI/SENAI)"
];

const INITIAL_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const INITIAL_TIMESLOTS = [
  // Manhã
  { id: "M1", label: "07:30 - 08:30", period: "Manhã", index: 1 },
  { id: "M2", label: "08:30 - 09:30", period: "Manhã", index: 2 },
  { id: "M3", label: "09:45 - 10:45", period: "Manhã", index: 3 },
  { id: "M4", label: "10:45 - 11:45", period: "Manhã", index: 4 },
  // Tarde
  { id: "T1", label: "13:00 - 14:00", period: "Tarde", index: 5 },
  { id: "T2", label: "14:00 - 15:00", period: "Tarde", index: 6 },
  { id: "T3", label: "15:15 - 16:15", period: "Tarde", index: 7 },
  { id: "T4", label: "16:15 - 17:15", period: "Tarde", index: 8 },
  // Noite
  { id: "N1", label: "18:00 - 18:50", period: "Noite", index: 9 },
  { id: "N2", label: "18:50 - 19:40", period: "Noite", index: 10 },
  { id: "N3", label: "19:50 - 20:40", period: "Noite", index: 11 },
  { id: "N4", label: "20:40 - 21:30", period: "Noite", index: 12 }
];

// Unidades Curriculares (UCs) com Suporte a BNCC, Técnico e Graduação
const INITIAL_SUBJECTS = [
  { id: "uc-h2v-1", code: "UC-H2V-01", name: "Sistemas de Produção de Hidrogênio Verde (H2V)", color: "bg-emerald-800 text-white border-emerald-600", reqType: "LAB_ENERGIAS", hoursTotal: 80, isPractical: true, modality: "graduacao", eixo: "Energias Renováveis & Hidrogênio Verde (H2V)" },
  { id: "uc-1", code: "UC-MEC-01", name: "Sistemas Automatizados de Manufatura", color: "bg-sky-800 text-white border-sky-600", reqType: "LAB_ROBOTICA", hoursTotal: 80, isPractical: true, modality: "tecnico", eixo: "Automação e Mecatrônica" },
  { id: "uc-eng-01", code: "ENG-AUT-101", name: "Controle & Sistemas Dinâmicos de Manufatura", color: "bg-amber-800 text-white border-amber-600", reqType: "LAB_GRADUACAO", hoursTotal: 120, isPractical: true, modality: "engenharia", eixo: "Engenharia & Tecnologias Avançadas" },
  { id: "uc-bncc-01", code: "BNCC-MAT-02", name: "Matemática Aplicada & Física Industrial (BNCC)", color: "bg-teal-800 text-white border-teal-600", reqType: "SALA_BNCC", hoursTotal: 80, isPractical: false, modality: "medio", eixo: "Formação Geral (BNCC SESI/SENAI)" },
  { id: "uc-2", code: "UC-ELE-02", name: "Instalações Eletroeletrônicas Industriais", color: "bg-blue-800 text-white border-blue-600", reqType: "LAB_ELETRONICA", hoursTotal: 120, isPractical: true, modality: "tecnico", eixo: "Eletroeletrônica" },
  { id: "uc-3", code: "UC-CNC-03", name: "Usinagem em Máquinas CNC", color: "bg-orange-700 text-white border-orange-500", reqType: "OFICINA_CNC", hoursTotal: 100, isPractical: true, modality: "tecnico", eixo: "Metalmecânica & Caldeiraria" },
  { id: "uc-tex-4", code: "UC-TEX-04", name: "Modelagem Computacional & Encaixe CAD Têxtil", color: "bg-pink-800 text-white border-pink-600", reqType: "LAB_TEXTIL", hoursTotal: 90, isPractical: true, modality: "aprendizagem", eixo: "Têxtil, Confecção e Moda" },
  { id: "uc-4", code: "UC-DEV-04", name: "Desenvolvimento de Sistemas Web & IoT", color: "bg-indigo-800 text-white border-indigo-600", reqType: "LAB_TI", hoursTotal: 160, isPractical: false, modality: "graduacao", eixo: "Tecnologia da Informação & Cibersegurança" },
  { id: "uc-6", code: "UC-SEG-06", name: "Segurança do Trabalho e NR-10/NR-35", color: "bg-cyan-800 text-white border-cyan-600", reqType: "SALA_TEORIA", hoursTotal: 40, isPractical: false, modality: "tecnico", eixo: "Eletroeletrônica" }
];

// Ambientes Pedagógicos SENAI
const INITIAL_ROOMS = [
  { id: "amb-ist-01", name: "IST Energias Renováveis & H2V (Lab Eletrolisadores)", capacity: 20, type: "LAB_ENERGIAS", nrCompliance: "NR-10 / NR-13 / NR-20", workstations: 10 },
  { id: "amb-101", name: "Lab. de Robótica Industrial & CLP", capacity: 20, type: "LAB_ROBOTICA", nrCompliance: "NR-12 / NR-10", workstations: 10 },
  { id: "amb-102", name: "Oficina de Usinagem & Caldeiraria CNC", capacity: 16, type: "OFICINA_CNC", nrCompliance: "NR-12 / NR-13", workstations: 8 },
  { id: "amb-grad-01", name: "Lab. Acadêmico de Engenharia & Mecatrônica (IST/Faculdade)", capacity: 30, type: "LAB_GRADUACAO", nrCompliance: "NR-10 / NR-12", workstations: 15 },
  { id: "amb-bncc-01", name: "Sala Polivalente SESI/SENAI 101 (Ensino Médio)", capacity: 40, type: "SALA_BNCC", nrCompliance: "Norma Escolar SESI", workstations: 40 },
  { id: "amb-tex-104", name: "Laboratório de Tecnologia Têxtil & Pilotagem", capacity: 25, type: "LAB_TEXTIL", nrCompliance: "NR-12 / NR-17", workstations: 15 },
  { id: "amb-104", name: "Lab. de Microinformática & IoT (Lab 04)", capacity: 32, type: "LAB_TI", nrCompliance: "NR-17", workstations: 32 },
  { id: "amb-105", name: "Bancadas de Eletrotécnica & Fotovoltaica", capacity: 24, type: "LAB_ELETRONICA", nrCompliance: "NR-10 / NR-35", workstations: 12 },
  { id: "amb-106", name: "Sala Multimídia 201 (Teoria)", capacity: 40, type: "SALA_TEORIA", nrCompliance: "Padrão SENAI", workstations: 40 }
];

// Docentes SENAI
const INITIAL_TEACHERS = [
  { id: "prof-h2v", name: "Dr. Francisco Germano (IST)", registration: "DOC-CE-7740", eixo: "Energias Renováveis & Hidrogênio Verde (H2V)", subjects: ["uc-h2v-1"], maxLessonsPerDay: 6, unavailable: [] },
  { id: "prof-1", name: "Eng. Carlos Eduardo Souza", registration: "DOC-CE-8841", eixo: "Automação e Mecatrônica", subjects: ["uc-1", "uc-eng-01"], maxLessonsPerDay: 6, unavailable: [{ day: "Sábado", timeslotId: "N1" }] },
  { id: "prof-bncc", name: "Profa. Ana Teresa (SESI)", registration: "DOC-SESI-102", eixo: "Formação Geral (BNCC SESI/SENAI)", subjects: ["uc-bncc-01"], maxLessonsPerDay: 8, unavailable: [] },
  { id: "prof-2", name: "Prof. Raimundo Nonato", registration: "DOC-CE-9120", eixo: "Metalmecânica & Caldeiraria", subjects: ["uc-3"], maxLessonsPerDay: 8, unavailable: [] },
  { id: "prof-3", name: "Profa. Maria das Graças", registration: "DOC-CE-3342", eixo: "Eletroeletrônica", subjects: ["uc-2", "uc-6"], maxLessonsPerDay: 6, unavailable: [{ day: "Quarta", timeslotId: "N3" }, { day: "Quarta", timeslotId: "N4" }] },
  { id: "prof-5", name: "Profa. Ana Paula Castro", registration: "DOC-CE-1192", eixo: "Têxtil, Confecção e Moda", subjects: ["uc-tex-4"], maxLessonsPerDay: 8, unavailable: [] }
];

// Turmas SENAI / SESI
const INITIAL_GROUPS = [
  { 
    id: "grp-bncc-1m", 
    name: "Ensino Médio SESI/SENAI - 1º Ano Turma A (Jacarecanga)", 
    modality: "medio", 
    eixo: "Formação Geral (BNCC SESI/SENAI)",
    shift: "Manhã", 
    size: 35, 
    requirements: [{ subjectId: "uc-bncc-01", count: 4, teacherId: "prof-bncc" }] 
  },
  { 
    id: "grp-eng-4n", 
    name: "Engenharia de Controle e Automação - 4º Semestre (Faculdade SENAI)", 
    modality: "engenharia", 
    eixo: "Engenharia & Tecnologias Avançadas",
    shift: "Noite", 
    size: 26, 
    requirements: [{ subjectId: "uc-eng-01", count: 4, teacherId: "prof-1" }] 
  },
  { 
    id: "grp-h2v-1n", 
    name: "Tecnólogo em Energias Renováveis & H2V - Turma 1N (IST SENAI)", 
    modality: "graduacao", 
    eixo: "Energias Renováveis & Hidrogênio Verde (H2V)",
    shift: "Noite", 
    size: 20, 
    requirements: [
      { subjectId: "uc-h2v-1", count: 4, teacherId: "prof-h2v" },
      { subjectId: "uc-6", count: 2, teacherId: "prof-3" }
    ] 
  },
  { 
    id: "grp-mec-3n", 
    name: "Técnico em Mecatrônica - Turma 3N (SENAI Maracanaú)", 
    modality: "tecnico", 
    eixo: "Automação e Mecatrônica",
    shift: "Noite", 
    size: 20, 
    requirements: [
      { subjectId: "uc-1", count: 4, teacherId: "prof-1" }
    ] 
  }
];

// Alocações Iniciais
const INITIAL_ALLOCATIONS = [
  { id: "alloc-bncc-1", groupId: "grp-bncc-1m", subjectId: "uc-bncc-01", teacherId: "prof-bncc", roomId: "amb-bncc-01", day: "Segunda", timeslotId: "M1" },
  { id: "alloc-bncc-2", groupId: "grp-bncc-1m", subjectId: "uc-bncc-01", teacherId: "prof-bncc", roomId: "amb-bncc-01", day: "Segunda", timeslotId: "M2" },
  { id: "alloc-eng-1", groupId: "grp-eng-4n", subjectId: "uc-eng-01", teacherId: "prof-1", roomId: "amb-grad-01", day: "Terça", timeslotId: "N1" },
  { id: "alloc-eng-2", groupId: "grp-eng-4n", subjectId: "uc-eng-01", teacherId: "prof-1", roomId: "amb-grad-01", day: "Terça", timeslotId: "N2" },
  { id: "alloc-h2v-1", groupId: "grp-h2v-1n", subjectId: "uc-h2v-1", teacherId: "prof-h2v", roomId: "amb-ist-01", day: "Quarta", timeslotId: "N1" },
  { id: "alloc-h2v-2", groupId: "grp-h2v-1n", subjectId: "uc-h2v-1", teacherId: "prof-h2v", roomId: "amb-ist-01", day: "Quarta", timeslotId: "N2" }
];

const DEFAULT_SENAI_CONFIG = {
  weights: {
    hardTeacherConflict: 10,
    hardRoomConflict: 10,
    hardGroupConflict: 10,
    hardCapacity: 10,
    hardUnavailability: 10,
    hardRoomType: 10,
    softTeacherOverload: 2,
    softGapsPenalty: 2,
    softPracticalBlockContinuity: 3
  },
  rules: {
    avoidGaps: true,
    requireContinuousPracticalBlocks: true
  }
};

export default function App() {
  // SENAI Scope Selection
  const [selectedRegional, setSelectedRegional] = useState('DR-CE');
  const [selectedUnit, setSelectedUnit] = useState('unit-[#005A9C]jacarecanga');
  const [filterModality, setFilterModality] = useState('all');

  // Navigation & Core States
  const [activeTab, setActiveTab] = useState('grid');
  const [days] = useState(INITIAL_DAYS);
  const [timeslots] = useState(INITIAL_TIMESLOTS);

  // Entities
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [teachers, setTeachers] = useState(INITIAL_TEACHERS);
  const [groups, setGroups] = useState(INITIAL_GROUPS);

  // Allocations with Undo / Redo
  const [allocations, setAllocationsHistory] = useState(INITIAL_ALLOCATIONS);
  const [history, setHistory] = useState([INITIAL_ALLOCATIONS]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Configuration & Snapshots
  const [config, setConfig] = useState(DEFAULT_SENAI_CONFIG);
  const [snapshots, setSnapshots] = useState([
    { id: 'snap-default', name: 'Matriz Geral SENAI Ceará 2026.1', date: new Date().toLocaleTimeString(), data: INITIAL_ALLOCATIONS }
  ]);

  // Filters & Solver
  const [viewMode, setViewMode] = useState('group');
  const [selectedEntityId, setSelectedEntityId] = useState(INITIAL_GROUPS[0].id);
  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);

  // Modals & Drag
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState({ day: null, timeslotId: null });
  const [draggedAllocId, setDraggedAllocId] = useState(null);

  const updateAllocations = (newAllocations) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newAllocations);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setAllocationsHistory(newAllocations);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAllocationsHistory(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAllocationsHistory(history[historyIndex + 1]);
    }
  };

  // Filtragem de Turmas por Modalidade Selecionada
  const filteredGroups = useMemo(() => {
    if (filterModality === 'all') return groups;
    return groups.filter(g => g.modality === filterModality);
  }, [groups, filterModality]);

  useEffect(() => {
    if (viewMode === 'group' && filteredGroups.length > 0) {
      setSelectedEntityId(filteredGroups[0].id);
    } else if (viewMode === 'teacher' && teachers.length > 0) {
      setSelectedEntityId(teachers[0].id);
    } else if (viewMode === 'room' && rooms.length > 0) {
      setSelectedEntityId(rooms[0].id);
    }
  }, [viewMode, filteredGroups, teachers, rooms]);

  // --- MOTOR DE RESTRIÇÕES TIMEFOLD AI (SENAI CONSTRAINT STREAM) ---
  const evaluateConstraints = useCallback((currentAllocations, currentConfig = config) => {
    const hardViolations = [];
    const softViolations = [];
    const w = currentConfig.weights;

    const teacherSlotMap = {};
    const roomSlotMap = {};
    const groupSlotMap = {};
    const teacherDayCount = {};

    currentAllocations.forEach(alloc => {
      const slotKey = `${alloc.day}-${alloc.timeslotId}`;
      const teacher = teachers.find(t => t.id === alloc.teacherId);
      const room = rooms.find(r => r.id === alloc.roomId);
      const group = groups.find(g => g.id === alloc.groupId);
      const subject = subjects.find(s => s.id === alloc.subjectId);

      // H1: Choque de Horário Docente
      const tKey = `${alloc.teacherId}_${slotKey}`;
      if (teacherSlotMap[tKey]) {
        hardViolations.push({
          type: 'H1',
          title: 'Choque de Horário Docente SENAI',
          description: `O docente ${teacher?.name || 'Desconhecido'} possui 2 turmas simultâneas em ${alloc.day} (${alloc.timeslotId}).`,
          allocations: [alloc.id, teacherSlotMap[tKey].id]
        });
      } else {
        teacherSlotMap[tKey] = alloc;
      }

      // H2: Choque de Ambiente Pedagógico
      const rKey = `${alloc.roomId}_${slotKey}`;
      if (roomSlotMap[rKey]) {
        hardViolations.push({
          type: 'H2',
          title: 'Conflito de Reserva de Ambiente Pedagógico',
          description: `O ambiente "${room?.name}" foi reservado para duas turmas em ${alloc.day} (${alloc.timeslotId}).`,
          allocations: [alloc.id, roomSlotMap[rKey].id]
        });
      } else {
        roomSlotMap[rKey] = alloc;
      }

      // H3: Choque de Horário de Turma
      const gKey = `${alloc.groupId}_${slotKey}`;
      if (groupSlotMap[gKey]) {
        hardViolations.push({
          type: 'H3',
          title: 'Choque de Horário da Turma',
          description: `A turma ${group?.name} possui duas UCs simultâneas (${alloc.day}, ${alloc.timeslotId}).`,
          allocations: [alloc.id, groupSlotMap[gKey].id]
        });
      } else {
        groupSlotMap[gKey] = alloc;
      }

      // H4: Capacidade de Alunos vs Postos de Trabalho NR
      if (room && group && room.capacity < group.size) {
        hardViolations.push({
          type: 'H4',
          title: 'Excesso de Lotação / Norma NR',
          description: `A turma ${group.name} (${group.size} alunos) excede os postos do ambiente ${room.name} (${room.capacity} vagas - ${room.nrCompliance}).`,
          allocations: [alloc.id]
        });
      }

      // H5: Indisponibilidade do Docente
      if (teacher && teacher.unavailable) {
        const isUnavailable = teacher.unavailable.some(un => un.day === alloc.day && un.timeslotId === alloc.timeslotId);
        if (isUnavailable) {
          hardViolations.push({
            type: 'H5',
            title: 'Indisponibilidade de Horário do Docente',
            description: `O docente ${teacher.name} possui restrição em ${alloc.day} (${alloc.timeslotId}).`,
            allocations: [alloc.id]
          });
        }
      }

      // H6: Incompatibilidade de Tipo de Ambiente Especializado
      if (subject && room && subject.reqType && subject.reqType !== 'SALA_TEORIA' && room.type !== subject.reqType) {
        hardViolations.push({
          type: 'H6',
          title: 'Incompatibilidade de Ambiente Pedagógico',
          description: `A UC "${subject.name}" requer ambiente do tipo "${subject.reqType}", mas foi alocada em "${room.type}".`,
          allocations: [alloc.id]
        });
      }

      const tdKey = `${alloc.teacherId}_${alloc.day}`;
      teacherDayCount[tdKey] = (teacherDayCount[tdKey] || 0) + 1;
    });

    // S1: Excesso de Carga Horária Diária Docente
    Object.keys(teacherDayCount).forEach(tdKey => {
      const [tId, day] = tdKey.split('_');
      const teacher = teachers.find(t => t.id === tId);
      if (teacher && teacherDayCount[tdKey] > teacher.maxLessonsPerDay) {
        softViolations.push({
          type: 'S1',
          title: 'Sobrecarga Diária de Carga Horária',
          description: `O docente ${teacher.name} possui ${teacherDayCount[tdKey]}h na ${day} (Limite recomendado: ${teacher.maxLessonsPerDay}h).`
        });
      }
    });

    const hardScore = -w.hardTeacherConflict * hardViolations.length;
    const softScore = -w.softTeacherOverload * softViolations.length;

    return { hardViolations, softViolations, hardScore, softScore };
  }, [teachers, rooms, groups, subjects, config]);

  const scoreAnalysis = useMemo(() => evaluateConstraints(allocations), [allocations, evaluateConstraints]);

  // --- DRAG AND DROP ---
  const handleDragStart = (e, allocId) => {
    setDraggedAllocId(allocId);
    e.dataTransfer.setData('text/plain', allocId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDay, targetTimeslotId) => {
    e.preventDefault();
    if (!draggedAllocId) return;

    const updated = allocations.map(a => {
      if (a.id === draggedAllocId) {
        return { ...a, day: targetDay, timeslotId: targetTimeslotId };
      }
      return a;
    });

    updateAllocations(updated);
    setDraggedAllocId(null);
  };

  // --- TIMEFOLD AI AUTO SOLVER ---
  const runAutoSolver = () => {
    setIsSolving(true);
    setSolverProgress(0);

    const unallocatedRequirements = [];
    filteredGroups.forEach(group => {
      group.requirements.forEach(req => {
        for (let i = 0; i < req.count; i++) {
          unallocatedRequirements.push({
            id: `gen-${group.id}-${req.subjectId}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            groupId: group.id,
            subjectId: req.subjectId,
            teacherId: req.teacherId
          });
        }
      });
    });

    let currentSolution = [];
    let step = 0;
    const totalSteps = unallocatedRequirements.length || 1;

    const interval = setInterval(() => {
      if (step >= unallocatedRequirements.length) {
        clearInterval(interval);
        setIsSolving(false);
        setSolverProgress(100);
        updateAllocations(currentSolution);
        return;
      }

      const req = unallocatedRequirements[step];
      const subject = subjects.find(s => s.id === req.subjectId);

      let bestChoice = null;
      let bestPenalty = Infinity;

      for (const day of days) {
        for (const slot of timeslots) {
          for (const room of rooms) {
            const candidateAlloc = {
              id: req.id,
              groupId: req.groupId,
              subjectId: req.subjectId,
              teacherId: req.teacherId,
              roomId: room.id,
              day,
              timeslotId: slot.id
            };

            const testList = [...currentSolution, candidateAlloc];
            const evalRes = evaluateConstraints(testList);

            let penalty = (Math.abs(evalRes.hardScore) * 100) + Math.abs(evalRes.softScore);

            if (subject && subject.reqType && subject.reqType !== 'SALA_TEORIA' && room.type !== subject.reqType) {
              penalty += 500;
            }

            if (penalty < bestPenalty) {
              bestPenalty = penalty;
              bestChoice = candidateAlloc;
            }
          }
        }
      }

      if (bestChoice) {
        currentSolution.push(bestChoice);
      }

      step++;
      setSolverProgress(Math.round((step / totalSteps) * 100));
      setAllocationsHistory([...currentSolution]);

    }, 35);
  };

  // --- SNAPSHOTS & EXPORT ---
  const saveSnapshot = () => {
    const name = prompt("Nome da Versão de Matriz SENAI:", `Matriz SENAI v${snapshots.length + 1}`);
    if (name) {
      setSnapshots([...snapshots, {
        id: `snap-${Date.now()}`,
        name,
        date: new Date().toLocaleTimeString(),
        data: [...allocations]
      }]);
    }
  };

  const loadSnapshot = (snap) => updateAllocations([...snap.data]);

  const exportSGEFormat = () => {
    let csvContent = "data:text/csv;charset=utf-8,Modalidade,Codigo_UC,Nome_UC,Turma,Shift,Docente,Matricula_Docente,Ambiente,Norma_NR,Dia,Horario\n";
    allocations.forEach(a => {
      const g = groups.find(g => g.id === a.groupId);
      const s = subjects.find(s => s.id === a.subjectId);
      const t = teachers.find(t => t.id === a.teacherId);
      const r = rooms.find(r => r.id === a.roomId);
      const slot = timeslots.find(ts => ts.id === a.timeslotId)?.label || '';
      csvContent += `"${g?.modality || ''}","${s?.code || ''}","${s?.name || ''}","${g?.name || ''}","${g?.shift || ''}","${t?.name || ''}","${t?.registration || ''}","${r?.name || ''}","${r?.nrCompliance || ''}","${a.day}","${slot}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SENAI_Matriz_Horarios_${selectedUnit}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSlotClick = (day, timeslotId) => {
    setActiveSlot({ day, timeslotId });
    setSlotModalOpen(true);
  };

  const assignLessonToSlot = (groupId, subjectId, teacherId, roomId) => {
    if (!groupId || !subjectId || !teacherId || !roomId) return;
    
    let filtered = allocations;
    if (viewMode === 'group') {
      filtered = allocations.filter(a => !(a.groupId === selectedEntityId && a.day === activeSlot.day && a.timeslotId === activeSlot.timeslotId));
    } else if (viewMode === 'teacher') {
      filtered = allocations.filter(a => !(a.teacherId === selectedEntityId && a.day === activeSlot.day && a.timeslotId === activeSlot.timeslotId));
    } else if (viewMode === 'room') {
      filtered = allocations.filter(a => !(a.roomId === selectedEntityId && a.day === activeSlot.day && a.timeslotId === activeSlot.timeslotId));
    }

    const newAlloc = {
      id: `manual-${Date.now()}`,
      groupId, subjectId, teacherId, roomId,
      day: activeSlot.day,
      timeslotId: activeSlot.timeslotId
    };

    updateAllocations([...filtered, newAlloc]);
    setSlotModalOpen(false);
  };

  const removeLesson = (allocId) => {
    updateAllocations(allocations.filter(a => a.id !== allocId));
  };

  // Taxa de ocupação dos ambientes
  const roomOccupancy = useMemo(() => {
    const totalSlotsPossible = days.length * timeslots.length;
    return rooms.map(room => {
      const usedSlots = allocations.filter(a => a.roomId === room.id).length;
      return {
        ...room,
        usedSlots,
        occupancyRate: Math.round((usedSlots / totalSlotsPossible) * 100)
      };
    });
  }, [rooms, allocations, days, timeslots]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-[#F37021] selection:text-white">
      {/* SENAI BRANDING HEADER */}
      <header className="bg-[#005A9C] border-b border-[#004070] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-white px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2">
            <span className="font-black tracking-tighter text-[#005A9C] text-2xl leading-none">SENAI</span>
            <div className="h-5 w-px bg-slate-300"></div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-tight block">
              Serviço Nacional de<br/>Aprendizagem Industrial
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-[#004070] px-3 py-1.5 rounded-lg border border-[#003055]">
            <Building2 className="w-4 h-4 text-[#F37021]" />
            <select 
              value={selectedRegional} 
              onChange={(e) => setSelectedRegional(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {SENAI_REGIONALS.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
            </select>
            <span className="text-slate-400 text-xs">/</span>
            <select 
              value={selectedUnit} 
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer max-w-[260px] truncate"
            >
              {SENAI_UNITS.filter(u => u.regionalId === selectedRegional).map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900">{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TIMEFOLD AI SCORE */}
        <div className="flex items-center gap-3 bg-[#004070]/90 border border-[#003055] px-4 py-1.5 rounded-xl">
          <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#F37021]" /> Timefold Score:
          </span>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded font-mono font-bold ${scoreAnalysis.hardScore === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
              {scoreAnalysis.hardScore === 0 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
              {scoreAnalysis.hardScore} Hard
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {scoreAnalysis.softScore} Soft
            </span>
          </div>
        </div>

        {/* ACOES DE CONTROLE */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#004070] rounded-lg border border-[#003055] p-1">
            <button onClick={undo} disabled={historyIndex === 0} className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-[#005A9C]" title="Desfazer (Undo)">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-[#005A9C]" title="Refazer (Redo)">
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={runAutoSolver} 
            disabled={isSolving}
            className="flex items-center gap-2 bg-[#F37021] hover:bg-[#e05f10] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-lg shadow-orange-900/30 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
            {isSolving ? `Otimizando Matriz SENAI (${solverProgress}%)` : 'Otimizador Automático (AI)'}
          </button>
        </div>
      </header>

      {/* TABS DE NAVEGAÇÃO */}
      <nav className="bg-slate-950 border-b border-slate-800 px-6 py-2 flex overflow-x-auto gap-2">
        {[
          { id: 'grid', label: 'Grade & Matriz de Aulas', icon: Calendar },
          { id: 'analytics', label: 'Ocupação de Oficinas & Labs', icon: Wrench },
          { id: 'snapshots', label: 'Cenários de Matriz', icon: Layers, count: snapshots.length },
          { id: 'config', label: 'Restrições Industriais (NR)', icon: Sliders },
          { id: 'solver', label: 'Conflitos & Auditoria', icon: ShieldAlert, badge: scoreAnalysis.hardViolations.length },
          { id: 'sge', label: 'Integração SGE SENAI / TOTVS', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-[#005A9C] text-white border border-[#0083CA] shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className="text-[11px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* CONTEUDO PRINCIPAL */}
      <main className="flex-1 p-6 overflow-y-auto bg-slate-900">
        {/* ================= TAB 1: GRADE VISUAL ================= */}
        {activeTab === 'grid' && (
          <div className="space-y-6">
            {/* PAINEL DE FILTROS E SELECAO DE MODALIDADE */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
              <div className="flex flex-wrap items-center gap-4">
                {/* FILTRO DE MODALIDADE (ENSINO MEDIO, TECNICO, GRADUACAO) */}
                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                  <GraduationCap className="w-4 h-4 text-[#F37021] ml-1" />
                  <select
                    value={filterModality}
                    onChange={(e) => setFilterModality(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
                  >
                    {MODALIDADES.map(m => <option key={m.id} value={m.id} className="bg-slate-900">{m.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 px-2 font-medium">Modo:</span>
                  {[
                    { id: 'group', label: 'Turma' },
                    { id: 'teacher', label: 'Docente' },
                    { id: 'room', label: 'Ambiente / Oficina' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === mode.id ? 'bg-[#005A9C] text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#F37021]" />
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:border-[#0083CA] min-w-[280px]"
                  >
                    {viewMode === 'group' && filteredGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.shift})</option>)}
                    {viewMode === 'teacher' && teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.eixo})</option>)}
                    {viewMode === 'room' && rooms.map(r => <option key={r.id} value={r.id}>{r.name} [{r.nrCompliance}]</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <Move className="w-3.5 h-3.5 text-[#F37021]" />
                  Arraste blocos para reagendar
                </span>
                <button 
                  onClick={() => updateAllocations([])}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar Matriz
                </button>
              </div>
            </div>

            {/* GRADE INTERATIVA DE AULAS */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[850px]">
                  <thead>
                    <tr className="bg-[#004070] text-white border-b border-slate-800">
                      <th className="p-3 text-xs font-bold uppercase tracking-wider text-left w-36 border-r border-[#003055]">
                        Turno / Horário
                      </th>
                      {days.map(day => (
                        <th key={day} className="p-3 text-xs font-bold text-center border-r border-[#003055] last:border-r-0">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeslots.map(slot => (
                      <tr key={slot.id} className="border-b border-slate-800/80 hover:bg-slate-900/60 transition-colors">
                        <td className="p-2.5 border-r border-slate-800 bg-slate-900/50">
                          <div className="font-mono text-xs font-bold text-[#F37021]">{slot.label}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">{slot.period}</div>
                        </td>

                        {days.map(day => {
                          let cellAllocations = [];
                          if (viewMode === 'group') {
                            cellAllocations = allocations.filter(a => a.groupId === selectedEntityId && a.day === day && a.timeslotId === slot.id);
                          } else if (viewMode === 'teacher') {
                            cellAllocations = allocations.filter(a => a.teacherId === selectedEntityId && a.day === day && a.timeslotId === slot.id);
                          } else if (viewMode === 'room') {
                            cellAllocations = allocations.filter(a => a.roomId === selectedEntityId && a.day === day && a.timeslotId === slot.id);
                          }

                          return (
                            <td 
                              key={day} 
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, day, slot.id)}
                              onClick={() => handleSlotClick(day, slot.id)}
                              className="p-2 border-r border-slate-800/80 last:border-r-0 align-top h-28 hover:bg-slate-850/50 transition-colors cursor-pointer relative group"
                            >
                              {cellAllocations.length === 0 ? (
                                <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded flex items-center gap-1 font-semibold">
                                    <Plus className="w-3 h-3 text-[#F37021]" /> Alocar UC
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-1.5 h-full">
                                  {cellAllocations.map(alloc => {
                                    const subject = subjects.find(s => s.id === alloc.subjectId);
                                    const group = groups.find(g => g.id === alloc.groupId);
                                    const teacher = teachers.find(t => t.id === alloc.teacherId);
                                    const room = rooms.find(r => r.id === alloc.roomId);

                                    const hasConflict = scoreAnalysis.hardViolations.some(v => v.allocations && v.allocations.includes(alloc.id));

                                    return (
                                      <div 
                                        key={alloc.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, alloc.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`p-2.5 rounded-lg border text-xs shadow-md cursor-grab active:cursor-grabbing transition-all relative ${
                                          hasConflict 
                                            ? 'bg-rose-950/90 border-rose-500 text-rose-100 ring-2 ring-rose-500/50' 
                                            : `${subject?.color || 'bg-slate-800 border-slate-700 text-white'}`
                                        }`}
                                      >
                                        {hasConflict && (
                                          <div className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 rounded-full shadow" title="Conflito de Regra SENAI!">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                          </div>
                                        )}

                                        <div className="font-bold text-[11px] flex items-center justify-between leading-tight">
                                          <span>{subject?.code}: {subject?.name}</span>
                                          <button 
                                            onClick={() => removeLesson(alloc.id)}
                                            className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-opacity"
                                            title="Desalocar Aula"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>

                                        <div className="mt-1.5 space-y-0.5 text-[10px] opacity-90 border-t border-white/10 pt-1">
                                          {viewMode !== 'group' && <div className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-200" /> {group?.name}</div>}
                                          {viewMode !== 'teacher' && <div className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-slate-200" /> {teacher?.name}</div>}
                                          {viewMode !== 'room' && <div className="flex items-center gap-1"><DoorOpen className="w-3 h-3 text-slate-200" /> {room?.name}</div>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: OCUPAÇÃO DE OFICINAS & LABS ================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#F37021]" /> Dashboard de Ocupação de Ambientes Pedagógicos
                </h2>
                <p className="text-xs text-slate-400">Taxa de utilização das Oficinas Industriais e Laboratórios SENAI / IST.</p>
              </div>
              <div className="bg-[#005A9C] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F37021]" /> Conformidade NRs
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roomOccupancy.map(room => (
                <div key={room.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-white">{room.name}</h3>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                        Segurança: {room.nrCompliance}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#F37021] bg-orange-950/40 border border-orange-900/50 px-2 py-1 rounded">
                      {room.occupancyRate}% Ocupado
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>Postos de Trabalho: {room.workstations} vagas</span>
                      <span>{room.usedSlots} horas/semana alocadas</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all ${room.occupancyRate > 75 ? 'bg-amber-500' : 'bg-[#005A9C]'}`} 
                        style={{ width: `${room.occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CENÁRIOS & SNAPSHOTS ================= */}
        {activeTab === 'snapshots' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#F37021]" /> Cenários de Matriz & Simulações
                </h2>
                <p className="text-xs text-slate-400">Salve versões para comparar pontuações de otimização antes da publicação.</p>
              </div>
              <button 
                onClick={saveSnapshot}
                className="bg-[#005A9C] hover:bg-[#004070] text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" /> Criar Novo Cenário
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snapshots.map(snap => {
                const evalSnap = evaluateConstraints(snap.data);
                return (
                  <div key={snap.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-white text-sm">{snap.name}</h3>
                        <span className="text-[10px] text-slate-500">{snap.date}</span>
                      </div>
                      <div className="flex gap-2 my-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${evalSnap.hardScore === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                          {evalSnap.hardScore} Hard
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {evalSnap.softScore} Soft
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{snap.data.length} aulas alocadas.</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                      <button 
                        onClick={() => loadSnapshot(snap)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-semibold"
                      >
                        <Check className="w-3.5 h-3.5 text-[#F37021]" /> Carregar Cenário
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 4: CONFIGURAÇÃO DE RESTRIÇÕES ================= */}
        {activeTab === 'config' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#F37021]" /> Regras de Otimização & Normas Industriais (NR)
            </h2>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2 text-[#0083CA]">
                  Pesos de Penalização (Score Timefold AI)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(config.weights).map(key => (
                    <div key={key} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
                      <span className="text-xs text-slate-300 font-mono">{key}</span>
                      <input 
                        type="number" 
                        value={config.weights[key]} 
                        onChange={(e) => setConfig({
                          ...config,
                          weights: { ...config.weights, [key]: parseInt(e.target.value) || 0 }
                        })}
                        className="w-16 bg-slate-950 border border-slate-700 text-right text-xs rounded p-1 text-[#F37021] font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: AUDITORIA DE CONFLITOS ================= */}
        {activeTab === 'solver' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-[#F37021]" /> Diagnóstico de Conflitos e Inconformidades
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${scoreAnalysis.hardScore === 0 ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Conflitos Impeditivos (Hard)</h3>
                  <span className={`text-2xl font-bold font-mono block mt-1 ${scoreAnalysis.hardScore === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {scoreAnalysis.hardScore}
                  </span>
                </div>

                <div className="p-4 rounded-xl border bg-amber-950/20 border-amber-500/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Avisos de Qualidade (Soft)</h3>
                  <span className="text-2xl font-bold font-mono text-amber-400 block mt-1">
                    {scoreAnalysis.softScore}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider border-b border-slate-800 pb-3 mb-3">
                  Violações Rígidas ({scoreAnalysis.hardViolations.length})
                </h3>
                {scoreAnalysis.hardViolations.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center">Nenhum conflito crítico impeditivo.</div>
                ) : (
                  <div className="space-y-2.5">
                    {scoreAnalysis.hardViolations.map((v, idx) => (
                      <div key={idx} className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs">
                        <div className="font-bold text-rose-300 flex items-center justify-between">
                          <span>{v.title}</span>
                          <span className="text-[10px] bg-rose-900 text-rose-200 px-1.5 py-0.5 rounded font-mono">{v.type}</span>
                        </div>
                        <p className="text-slate-300 mt-1">{v.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-3 mb-3">
                  Melhorias Sugeridas ({scoreAnalysis.softViolations.length})
                </h3>
                {scoreAnalysis.softViolations.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center">Matriz perfeitamente otimizada.</div>
                ) : (
                  <div className="space-y-2.5">
                    {scoreAnalysis.softViolations.map((v, idx) => (
                      <div key={idx} className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg text-xs">
                        <div className="font-bold text-amber-300 flex items-center justify-between">
                          <span>{v.title}</span>
                          <span className="text-[10px] bg-amber-900/80 text-amber-200 px-1.5 py-0.5 rounded font-mono">{v.type}</span>
                        </div>
                        <p className="text-slate-300 mt-1">{v.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: INTEGRAÇÃO SGE / TOTVS ================= */}
        {activeTab === 'sge' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#F37021]" /> Exportação & Integração SGE SENAI / TOTVS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0083CA]" /> Exportar para SGE SENAI (CSV)
                  </h3>
                  <p className="text-xs text-slate-400">Gera a matriz formatada para importação nos sistemas corporativos de Gestão Escolar SENAI.</p>
                </div>
                <button 
                  onClick={exportSGEFormat}
                  className="mt-6 bg-[#005A9C] hover:bg-[#004070] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <Download className="w-4 h-4" /> Baixar Planilha (.CSV)
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" /> Relatório de Plano Docente
                  </h3>
                  <p className="text-xs text-slate-400">Resumo da distribuição de carga horária por docente e eixo tecnológico.</p>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="mt-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Printer className="w-4 h-4 text-[#F37021]" /> Imprimir Relatórios
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE ALOCAÇÃO MANUAL */}
      {slotModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#F37021]" /> Alocar Unidade Curricular
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Horário: <span className="text-[#F37021] font-bold">{activeSlot.day} ({activeSlot.timeslotId})</span>
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              assignLessonToSlot(
                formData.get('groupId'),
                formData.get('subjectId'),
                formData.get('teacherId'),
                formData.get('roomId')
              );
            }} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Turma SENAI</label>
                <select name="groupId" defaultValue={viewMode === 'group' ? selectedEntityId : ''} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Unidade Curricular (UC)</label>
                <select name="subjectId" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code}: {s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Docente</label>
                <select name="teacherId" defaultValue={viewMode === 'teacher' ? selectedEntityId : ''} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.registration})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Ambiente / Oficina</label>
                <select name="roomId" defaultValue={viewMode === 'room' ? selectedEntityId : ''} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200">
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name} [{r.nrCompliance}]</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setSlotModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#005A9C] hover:bg-[#004070] text-white"
                >
                  Confirmar Alocação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}