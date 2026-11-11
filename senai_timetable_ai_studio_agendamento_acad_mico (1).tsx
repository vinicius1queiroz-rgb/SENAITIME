import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  Building2, Calendar, Users, GraduationCap, Wrench, Play, RotateCcw,
  Download, Upload, ShieldAlert, CheckCircle2, AlertTriangle, Filter,
  Plus, Trash2, Save, FileSpreadsheet, Layers, Sparkles, MapPin, Award,
  Undo2, Redo2, BarChart3, Sliders, Bell, ShieldCheck, UserCheck, DoorOpen,
  BookOpen, Clock, Search, Edit3, X, Check, Send, RefreshCw, Database,
  Lock, Unlock, FileText, Printer, Move, ChevronRight, AlertCircle
} from 'lucide-react';

// ============================================================================
// INICIALIZAÇÃO DO FIREBASE (PERSISTÊNCIA EM NUVEM)
// ============================================================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'senai-timetable-studio-prod';

// ============================================================================
// CONSTANTES INSTITUCIONAIS SENAI (DR-CE & BRASIL)
// ============================================================================
const REGIONAL_DEPARTMENTS = [
  {
    code: 'DR-CE',
    name: 'SENAI Ceará (Sistema FIEC)',
    units: [
      'SENAI Jacarecanga (CFP Waldyr Diogo)',
      'SENAI Barra do Ceará (CFP Antonio Urbano)',
      'SENAI Maracanaú (CFP Edilson Távora)',
      'SENAI Mucuripe (CFP José de Alencar)',
      'SENAI Sobral (CFP Raimundo Viana)',
      'SENAI Juazeiro do Norte (CFP Mário Dedé)',
      'SENAI Horizonte (CFP Eurípedes Ferreira)',
      'Faculdade SENAI Ceará / IST Eficiência Energética'
    ]
  },
  {
    code: 'DR-SP',
    name: 'SENAI São Paulo',
    units: ['SENAI Vila Mariana', 'SENAI Suíço-Brasileira', 'SENAI Armando de Arruda Pereira']
  },
  {
    code: 'DR-BA',
    name: 'SENAI Bahia',
    units: ['SENAI CIMATEC (Salvador)', 'SENAI Camaçari', 'SENAI Feira de Santana']
  },
  {
    code: 'DR-MG',
    name: 'SENAI Minas Gerais',
    units: ['SENAI CETEC Itaúna', 'SENAI Modesto Freire (Uberaba)', 'SENAI Belo Horizonte']
  },
  {
    code: 'DR-SC',
    name: 'SENAI Santa Catarina',
    units: ['SENAI Florianópolis', 'SENAI Joinville', 'SENAI Blumenau']
  }
];

const SEMESTERS = ['2026.1', '2026.2', '2027.1'];

const MODALIDADES = [
  { id: 'medio', name: 'Ensino Médio Integrado (SESI/SENAI - BNCC)', short: 'Ensino Médio', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', card: 'bg-emerald-50 border-emerald-400 text-emerald-950' },
  { id: 'tecnico', name: 'Curso Técnico (Subsequente / Concomitante)', short: 'Técnico', badge: 'bg-sky-100 text-sky-800 border-sky-300', card: 'bg-sky-50 border-sky-400 text-sky-950' },
  { id: 'graduacao', name: 'Graduação Tecnológica (Superior)', short: 'Graduação Tec.', badge: 'bg-purple-100 text-purple-800 border-purple-300', card: 'bg-purple-50 border-purple-400 text-purple-950' },
  { id: 'engenharia', name: 'Engenharia / Bacharelado (IST)', short: 'Engenharia', badge: 'bg-amber-100 text-amber-800 border-amber-300', card: 'bg-amber-50 border-amber-400 text-amber-950' },
  { id: 'aprendizagem', name: 'Aprendizagem Industrial', short: 'Aprendizagem', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', card: 'bg-indigo-50 border-indigo-400 text-indigo-950' },
  { id: 'qualificacao', name: 'Qualificação Profissional', short: 'Qualificação', badge: 'bg-slate-200 text-slate-800 border-slate-400', card: 'bg-slate-100 border-slate-400 text-slate-950' }
];

const EIXOS_TECNOLOGICOS = [
  'Energias Renováveis & Hidrogênio Verde (H2V)',
  'Eletroeletrônica e Automação',
  'Metalmecânica e Usinagem',
  'Têxtil, Moda e Vestuário',
  'TI, Cibersegurança & IoT',
  'Formação Geral (BNCC SESI/SENAI)'
];

const ROOM_TYPES = [
  { id: 'LAB_ENERGIAS', name: 'Lab. Energias Renováveis & H2V' },
  { id: 'LAB_ROBOTICA', name: 'Lab. Robótica & Automação CLP' },
  { id: 'OFICINA_CNC', name: 'Oficina Metalmecânica & CNC' },
  { id: 'LAB_ELETRONICA', name: 'Lab. Eletroeletrônica & Fotovoltaica' },
  { id: 'LAB_TEXTIL', name: 'Lab. Têxtil & CAD Confecção' },
  { id: 'LAB_TI', name: 'Lab. Informática, Redes & IoT' },
  { id: 'LAB_GRADUACAO', name: 'Lab. Acadêmico Engenharia (IST)' },
  { id: 'SALA_BNCC', name: 'Sala Polivalente Ensino Médio (BNCC)' },
  { id: 'SALA_TEORIA', name: 'Sala Teórica Padrão SENAI' }
];

const NR_OPTIONS = ['Padrão Escolar', 'NR-10', 'NR-12', 'NR-13', 'NR-17', 'NR-18', 'NR-20', 'NR-35', 'NR-10 / NR-12', 'NR-13 / NR-20'];

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const PERIODS = [
  { id: 'M1', name: 'Manhã 1', time: '07:30 - 09:30', turn: 'Manhã', order: 1 },
  { id: 'M2', name: 'Manhã 2', time: '09:45 - 11:45', turn: 'Manhã', order: 2 },
  { id: 'T1', name: 'Tarde 1', time: '13:15 - 15:15', turn: 'Tarde', order: 3 },
  { id: 'T2', name: 'Tarde 2', time: '15:30 - 17:30', turn: 'Tarde', order: 4 },
  { id: 'N1', name: 'Noite 1', time: '18:30 - 20:15', turn: 'Noite', order: 5 },
  { id: 'N2', name: 'Noite 2', time: '20:30 - 22:15', turn: 'Noite', order: 6 }
];

const ROLES = [
  { id: 'admin', label: 'Coordenador Pedagógico (Admin)', badge: 'bg-orange-500 text-white' },
  { id: 'supervisor', label: 'Supervisor de Eixo / Oficina', badge: 'bg-sky-600 text-white' },
  { id: 'teacher', label: 'Docente / Instrutor', badge: 'bg-emerald-600 text-white' }
];

// ============================================================================
// BASE PADRÃO INICIAL (SENAI CEARÁ)
// ============================================================================
const SEED_TEACHERS = [
  { id: 'T1', name: 'Dr. Francisco Germano (IST)', reg: 'SENAI-CE-7740', eixos: ['Energias Renováveis & Hidrogênio Verde (H2V)', 'Eletroeletrônica e Automação'], maxDailySlots: 3, unavailable: ['Sexta-N2'] },
  { id: 'T2', name: 'Eng. Carlos Eduardo Souza', reg: 'SENAI-CE-8841', eixos: ['Eletroeletrônica e Automação'], maxDailySlots: 4, unavailable: ['Segunda-M1'] },
  { id: 'T3', name: 'Prof. Raimundo Nonato', reg: 'SENAI-CE-9120', eixos: ['Metalmecânica e Usinagem'], maxDailySlots: 4, unavailable: [] },
  { id: 'T4', name: 'Profa. Ana Teresa (SESI/SENAI)', reg: 'SESI-CE-1022', eixos: ['Formação Geral (BNCC SESI/SENAI)'], maxDailySlots: 4, unavailable: ['Quinta-T2'] },
  { id: 'T5', name: 'Profa. Ana Paula Castro', reg: 'SENAI-CE-1192', eixos: ['Têxtil, Moda e Vestuário'], maxDailySlots: 4, unavailable: [] },
  { id: 'T6', name: 'Prof. Lucas Vasconcelos', reg: 'SENAI-CE-5530', eixos: ['TI, Cibersegurança & IoT'], maxDailySlots: 4, unavailable: [] }
];

const SEED_ROOMS = [
  { id: 'R1', name: 'IST Lab. Hidrogênio Verde & Células Combustível', capacity: 22, type: 'LAB_ENERGIAS', nr: 'NR-13 / NR-20', unit: 'Faculdade SENAI Ceará / IST Eficiência Energética' },
  { id: 'R2', name: 'Lab. Robótica Industrial & CLP Siemens', capacity: 24, type: 'LAB_ROBOTICA', nr: 'NR-10 / NR-12', unit: 'SENAI Jacarecanga (CFP Waldyr Diogo)' },
  { id: 'R3', name: 'Oficina de Usinagem CNC & Solda TIG', capacity: 18, type: 'OFICINA_CNC', nr: 'NR-12 / NR-18', unit: 'SENAI Maracanaú (CFP Edilson Távora)' },
  { id: 'R4', name: 'Lab. Eletrotécnica & Energia Solar', capacity: 25, type: 'LAB_ELETRONICA', nr: 'NR-10 / NR-35', unit: 'SENAI Barra do Ceará (CFP Antonio Urbano)' },
  { id: 'R5', name: 'Lab. Modelagem CAD & Pilotagem Têxtil', capacity: 25, type: 'LAB_TEXTIL', nr: 'NR-12 / NR-17', unit: 'SENAI Mucuripe (CFP José de Alencar)' },
  { id: 'R6', name: 'Lab. Redes, Cloud & IoT Industrial', capacity: 32, type: 'LAB_TI', nr: 'NR-17', unit: 'SENAI Jacarecanga (CFP Waldyr Diogo)' },
  { id: 'R7', name: 'Lab. Acadêmico Engenharia Mecatrônica', capacity: 30, type: 'LAB_GRADUACAO', nr: 'NR-10 / NR-12', unit: 'Faculdade SENAI Ceará / IST Eficiência Energética' },
  { id: 'R8', name: 'Sala Polivalente 101 - SESI/SENAI (BNCC)', capacity: 40, type: 'SALA_BNCC', nr: 'Padrão Escolar', unit: 'SENAI Jacarecanga (CFP Waldyr Diogo)' },
  { id: 'R9', name: 'Sala Teórica 204 - Bloco B', capacity: 40, type: 'SALA_TEORIA', nr: 'Padrão Escolar', unit: 'SENAI Jacarecanga (CFP Waldyr Diogo)' }
];

const SEED_SUBJECTS = [
  { id: 'S1', code: 'UC-H2V-01', name: 'Eletrolisadores e Produção de Hidrogênio Verde', hours: 80, weeklySlots: 2, reqType: 'LAB_ENERGIAS', modality: 'graduacao', eixo: 'Energias Renováveis & Hidrogênio Verde (H2V)', isPractical: true },
  { id: 'S2', code: 'UC-AUT-02', name: 'Automação Industrial e Programação de CLPs', hours: 80, weeklySlots: 2, reqType: 'LAB_ROBOTICA', modality: 'tecnico', eixo: 'Eletroeletrônica e Automação', isPractical: true },
  { id: 'S3', code: 'UC-MEC-03', name: 'Programação e Operação de Torno/Centro CNC', hours: 100, weeklySlots: 2, reqType: 'OFICINA_CNC', modality: 'tecnico', eixo: 'Metalmecânica e Usinagem', isPractical: true },
  { id: 'S4', code: 'ENG-MEC-04', name: 'Sistemas Dinâmicos e Controle Avançado', hours: 80, weeklySlots: 2, reqType: 'LAB_GRADUACAO', modality: 'engenharia', eixo: 'Eletroeletrônica e Automação', isPractical: true },
  { id: 'S5', code: 'BNCC-MAT-05', name: 'Matemática Aplicada e Física Industrial (BNCC)', hours: 120, weeklySlots: 3, reqType: 'SALA_BNCC', modality: 'medio', eixo: 'Formação Geral (BNCC SESI/SENAI)', isPractical: false },
  { id: 'S6', code: 'UC-IOT-06', name: 'Desenvolvimento IoT e Indústria 4.0', hours: 60, weeklySlots: 2, reqType: 'LAB_TI', modality: 'tecnico', eixo: 'TI, Cibersegurança & IoT', isPractical: true },
  { id: 'S7', code: 'UC-NR-07', name: 'Segurança em Instalações Elétricas (NR-10)', hours: 40, weeklySlots: 1, reqType: 'SALA_TEORIA', modality: 'aprendizagem', eixo: 'Eletroeletrônica e Automação', isPractical: false }
];

const SEED_CLASSES = [
  { id: 'C1', code: 'EM-SESI-2A', name: 'Ensino Médio SESI/SENAI 2º Ano A (Automação)', modality: 'medio', shift: 'Manhã', size: 34, subjectIds: ['S5', 'S2'] },
  { id: 'C2', code: 'TEC-AUT-261', name: 'Técnico em Automação Industrial 2026.1', modality: 'tecnico', shift: 'Tarde', size: 22, subjectIds: ['S2', 'S6', 'S7'] },
  { id: 'C3', code: 'TEC-MEC-261', name: 'Técnico em Mecânica Industrial 2026.1', modality: 'tecnico', shift: 'Noite', size: 18, subjectIds: ['S3', 'S7'] },
  { id: 'C4', code: 'GRAD-H2V-01', name: 'Tecnólogo em Energias Renováveis & H2V', modality: 'graduacao', shift: 'Noite', size: 20, subjectIds: ['S1', 'S6'] },
  { id: 'C5', code: 'ENG-CTR-04', name: 'Engenharia de Controle e Automação (4º Sem)', modality: 'engenharia', shift: 'Noite', size: 26, subjectIds: ['S4', 'S1'] }
];

const SEED_SCHEDULE_2026_1 = [
  { id: 'al-1', classId: 'C1', subjectId: 'S5', teacherId: 'T4', roomId: 'R8', day: 'Segunda', periodId: 'M1' },
  { id: 'al-2', classId: 'C1', subjectId: 'S5', teacherId: 'T4', roomId: 'R8', day: 'Segunda', periodId: 'M2' },
  { id: 'al-3', classId: 'C1', subjectId: 'S2', teacherId: 'T2', roomId: 'R2', day: 'Quarta', periodId: 'M1' },
  { id: 'al-4', classId: 'C1', subjectId: 'S2', teacherId: 'T2', roomId: 'R2', day: 'Quarta', periodId: 'M2' },
  { id: 'al-5', classId: 'C2', subjectId: 'S2', teacherId: 'T2', roomId: 'R2', day: 'Terça', periodId: 'T1' },
  { id: 'al-6', classId: 'C2', subjectId: 'S6', teacherId: 'T6', roomId: 'R6', day: 'Quinta', periodId: 'T1' },
  { id: 'al-7', classId: 'C4', subjectId: 'S1', teacherId: 'T1', roomId: 'R1', day: 'Segunda', periodId: 'N1' },
  { id: 'al-8', classId: 'C4', subjectId: 'S1', teacherId: 'T1', roomId: 'R1', day: 'Segunda', periodId: 'N2' },
  { id: 'al-9', classId: 'C5', subjectId: 'S4', teacherId: 'T2', roomId: 'R7', day: 'Quarta', periodId: 'N1' },
  { id: 'al-10', classId: 'C3', subjectId: 'S3', teacherId: 'T3', roomId: 'R3', day: 'Quinta', periodId: 'N1' }
];

export default function App() {
  // ==========================================================================
  // ESTADOS DE AUTENTICAÇÃO & NUVEM (FIREBASE)
  // ==========================================================================
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting' | 'synced' | 'saving' | 'offline'
  const isRemoteUpdate = useRef(false);

  // ==========================================================================
  // CONTEXTO INSTITUCIONAL & RBAC
  // ==========================================================================
  const [selectedDR, setSelectedDR] = useState('DR-CE');
  const [selectedUnit, setSelectedUnit] = useState('SENAI Jacarecanga (CFP Waldyr Diogo)');
  const [selectedSemester, setSelectedSemester] = useState('2026.1');
  const [currentRole, setCurrentRole] = useState('admin'); // 'admin' | 'supervisor' | 'teacher'
  const [activeTab, setActiveTab] = useState('grid');

  // ==========================================================================
  // DADOS PRINCIPAIS DO DOMÍNIO
  // ==========================================================================
  const [teachers, setTeachers] = useState(SEED_TEACHERS);
  const [rooms, setRooms] = useState(SEED_ROOMS);
  const [subjects, setSubjects] = useState(SEED_SUBJECTS);
  const [classes, setClasses] = useState(SEED_CLASSES);
  const [schedulesBySemester, setSchedulesBySemester] = useState({
    '2026.1': SEED_SCHEDULE_2026_1,
    '2026.2': [],
    '2027.1': []
  });

  // Histórico Undo / Redo por sessão
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Snapshots de cenários
  const [snapshots, setSnapshots] = useState([
    { id: 'snap-1', name: 'Cenário Base Oficial 2026.1', timestamp: 'Hoje, 08:00', semester: '2026.1', schedule: SEED_SCHEDULE_2026_1 }
  ]);

  // Auditoria & Notificações
  const [auditLogs, setAuditLogs] = useState([
    { id: 'log-1', time: '08:15', role: 'Coordenador Pedagógico', action: 'Matriz 2026.1 inicializada com parâmetros do SENAI Ceará (DR-CE).' },
    { id: 'log-2', time: '09:30', role: 'Supervisor de Oficina', action: 'Validada conformidade NR-13 / NR-20 no IST Lab. Hidrogênio Verde.' }
  ]);
  const [notifications, setNotifications] = useState([
    { id: 'not-1', time: '10:05', from: 'Dr. Francisco Germano (Docente)', type: 'Solicitação de Ajuste', message: 'Solicito reserva prioritária do IST Lab. H2V nas segundas-feiras à noite para aulas práticas de eletrólise.', status: 'Pendente' }
  ]);

  // Pesos do Motor de Otimização
  const [weights, setWeights] = useState({
    hardConflict: 100,
    hardCapacity: 80,
    hardRoomType: 90,
    hardUnavailable: 100,
    softGap: 10,
    softPracticalSplit: 15,
    softOverload: 20
  });

  // ==========================================================================
  // FILTROS & CONTROLES DE INTERFACE
  // ==========================================================================
  const [viewMode, setViewMode] = useState('class'); // 'class' | 'teacher' | 'room'
  const [selectedEntityId, setSelectedEntityId] = useState('C1');
  const [filterModality, setFilterModality] = useState('all');
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  // Modais
  const [allocModal, setAllocModal] = useState({ open: false, day: '', periodId: '' });
  const [teacherRequestModal, setTeacherRequestModal] = useState(false);
  const [crudModal, setCrudModal] = useState({ open: false, type: '', item: null });
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const addAuditLog = useCallback((actionText) => {
    const roleLabel = ROLES.find(r => r.id === currentRole)?.label || 'Sistema';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setAuditLogs(prev => [{ id: `log-${Date.now()}`, time: timeStr, role: roleLabel, action: actionText }, ...prev.slice(0, 49)]);
  }, [currentRole]);

  // ==========================================================================
  // SINCRONIZAÇÃO FIREBASE AUTH & FIRESTORE
  // ==========================================================================
  useEffect(() => {
    if (!auth) {
      setSyncStatus('offline');
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Erro na autenticação Firebase:', err);
        setSyncStatus('offline');
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setSyncStatus('offline');
    });
    return () => unsub();
  }, []);

  // Carregar dados em tempo real do Firestore
  useEffect(() => {
    if (!user || !db) return;
    const stateDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'senai_studio_state', 'master_v1');

    const unsub = onSnapshot(
      stateDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          isRemoteUpdate.current = true;
          if (data.teachers) setTeachers(data.teachers);
          if (data.rooms) setRooms(data.rooms);
          if (data.subjects) setSubjects(data.subjects);
          if (data.classes) setClasses(data.classes);
          if (data.schedulesBySemester) setSchedulesBySemester(data.schedulesBySemester);
          if (data.auditLogs) setAuditLogs(data.auditLogs);
          if (data.notifications) setNotifications(data.notifications);
          if (data.snapshots) setSnapshots(data.snapshots);
          if (data.weights) setWeights(data.weights);
          setSyncStatus('synced');
          setTimeout(() => { isRemoteUpdate.current = false; }, 300);
        } else {
          // Primeira execução: grava os dados padrão do SENAI Ceará na nuvem
          setDoc(stateDocRef, {
            teachers: SEED_TEACHERS,
            rooms: SEED_ROOMS,
            subjects: SEED_SUBJECTS,
            classes: SEED_CLASSES,
            schedulesBySemester: { '2026.1': SEED_SCHEDULE_2026_1, '2026.2': [], '2027.1': [] },
            auditLogs,
            notifications,
            snapshots,
            weights
          }).then(() => setSyncStatus('synced'));
        }
      },
      (error) => {
        console.error('Erro Firestore onSnapshot:', error);
        setSyncStatus('offline');
      }
    );

    return () => unsub();
  }, [user]);

  // Salvar alterações automaticamente no Firestore (Debounce)
  useEffect(() => {
    if (!user || !db || isRemoteUpdate.current) return;
    setSyncStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const stateDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'senai_studio_state', 'master_v1');
        await setDoc(stateDocRef, {
          teachers,
          rooms,
          subjects,
          classes,
          schedulesBySemester,
          auditLogs,
          notifications,
          snapshots,
          weights,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        setSyncStatus('synced');
      } catch (err) {
        console.error('Erro ao salvar no Firestore:', err);
        setSyncStatus('offline');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [teachers, rooms, subjects, classes, schedulesBySemester, auditLogs, notifications, snapshots, weights, user]);

  // Grade ativa do semestre atual
  const currentSchedule = useMemo(() => {
    return schedulesBySemester[selectedSemester] || [];
  }, [schedulesBySemester, selectedSemester]);

  const updateCurrentSchedule = useCallback((newList, logText = null) => {
    setUndoStack(prev => [...prev.slice(-19), currentSchedule]);
    setRedoStack([]);
    setSchedulesBySemester(prev => ({
      ...prev,
      [selectedSemester]: newList
    }));
    if (logText) addAuditLog(logText);
  }, [currentSchedule, selectedSemester, addAuditLog]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, currentSchedule]);
    setUndoStack(prev => prev.slice(0, -1));
    setSchedulesBySemester(prev => ({ ...prev, [selectedSemester]: previous }));
    showToast('Ação desfeita.');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, currentSchedule]);
    setRedoStack(prev => prev.slice(0, -1));
    setSchedulesBySemester(prev => ({ ...prev, [selectedSemester]: next }));
    showToast('Ação refeita.');
  };

  const handleResetToSenaiDefault = () => {
    if (currentRole !== 'admin') {
      showToast('Apenas Coordenador Pedagógico (Admin) pode restaurar a base.', 'error');
      return;
    }
    setTeachers(SEED_TEACHERS);
    setRooms(SEED_ROOMS);
    setSubjects(SEED_SUBJECTS);
    setClasses(SEED_CLASSES);
    setSchedulesBySemester({
      '2026.1': SEED_SCHEDULE_2026_1,
      '2026.2': [],
      '2027.1': []
    });
    addAuditLog('Base padrão do SENAI Ceará restaurada pelo Administrador.');
    showToast('Base padrão SENAI Ceará restaurada com sucesso!', 'success');
  };

  // ==========================================================================
  // PERMISSÕES RBAC
  // ==========================================================================
  const canEditSchedule = currentRole === 'admin' || currentRole === 'supervisor';
  const canManageEntities = currentRole === 'admin';
  const canRunSolver = currentRole === 'admin';

  // ==========================================================================
  // MOTOR DE AVALIAÇÃO DE RESTRIÇÕES (TIMEFOLD SCORE ENGINE)
  // ==========================================================================
  const evaluation = useMemo(() => {
    let hardScore = 0;
    let softScore = 0;
    const violations = [];
    const conflictingIds = new Set();

    const teacherSlots = {};
    const roomSlots = {};
    const classSlots = {};
    const teacherDailyCount = {};

    currentSchedule.forEach((item) => {
      const slotKey = `${item.day}-${item.periodId}`;
      const cls = classes.find(c => c.id === item.classId);
      const sub = subjects.find(s => s.id === item.subjectId);
      const tch = teachers.find(t => t.id === item.teacherId);
      const rm = rooms.find(r => r.id === item.roomId);

      // 1. Choque de Docente
      const tKey = `${item.teacherId}@${slotKey}`;
      if (teacherSlots[tKey]) {
        hardScore -= weights.hardConflict;
        conflictingIds.add(item.id);
        conflictingIds.add(teacherSlots[tKey]);
        violations.push({
          id: `v-t-${item.id}`,
          severity: 'HARD',
          title: 'Choque de Horário Docente',
          detail: `${tch?.name || 'Docente'} alocado em duas turmas simultaneamente (${item.day} - ${item.periodId}).`,
          targetType: 'teacher',
          targetId: item.teacherId
        });
      } else {
        teacherSlots[tKey] = item.id;
      }

      // 2. Choque de Ambiente / Oficina
      const rKey = `${item.roomId}@${slotKey}`;
      if (roomSlots[rKey]) {
        hardScore -= weights.hardConflict;
        conflictingIds.add(item.id);
        conflictingIds.add(roomSlots[rKey]);
        violations.push({
          id: `v-r-${item.id}`,
          severity: 'HARD',
          title: 'Conflito de Ambiente / Oficina',
          detail: `${rm?.name || 'Ambiente'} ocupado por duas turmas em ${item.day} (${item.periodId}).`,
          targetType: 'room',
          targetId: item.roomId
        });
      } else {
        roomSlots[rKey] = item.id;
      }

      // 3. Choque de Turma
      const cKey = `${item.classId}@${slotKey}`;
      if (classSlots[cKey]) {
        hardScore -= weights.hardConflict;
        conflictingIds.add(item.id);
        conflictingIds.add(classSlots[cKey]);
        violations.push({
          id: `v-c-${item.id}`,
          severity: 'HARD',
          title: 'Choque de Turma',
          detail: `Turma ${cls?.code || ''} possui duas UCs no mesmo horário (${item.day} - ${item.periodId}).`,
          targetType: 'class',
          targetId: item.classId
        });
      } else {
        classSlots[cKey] = item.id;
      }

      // 4. Indisponibilidade Docente
      if (tch?.unavailable?.includes(slotKey)) {
        hardScore -= weights.hardUnavailable;
        conflictingIds.add(item.id);
        violations.push({
          id: `v-un-${item.id}`,
          severity: 'HARD',
          title: 'Indisponibilidade Docente',
          detail: `${tch.name} possui bloqueio registrado em ${item.day} (${item.periodId}).`,
          targetType: 'teacher',
          targetId: item.teacherId
        });
      }

      // 5. Capacidade de Postos vs Tamanho da Turma
      if (cls && rm && cls.size > rm.capacity) {
        hardScore -= weights.hardCapacity;
        conflictingIds.add(item.id);
        violations.push({
          id: `v-cap-${item.id}`,
          severity: 'HARD',
          title: 'Excesso de Lotação (Segurança NR)',
          detail: `Turma ${cls.code} (${cls.size} alunos) excede os ${rm.capacity} postos de ${rm.name} (${rm.nr}).`,
          targetType: 'room',
          targetId: item.roomId
        });
      }

      // 6. Compatibilidade de Tipo de Ambiente Exigido pela UC
      if (sub && rm && sub.reqType !== 'SALA_TEORIA' && sub.reqType !== rm.type) {
        hardScore -= weights.hardRoomType;
        conflictingIds.add(item.id);
        violations.push({
          id: `v-type-${item.id}`,
          severity: 'HARD',
          title: 'Ambiente Incompatível com a UC',
          detail: `UC "${sub.name}" exige ambiente tipo ${sub.reqType}, mas está em ${rm.name}.`,
          targetType: 'class',
          targetId: item.classId
        });
      }

      // Contagem diária docente para Soft Constraint
      const tdKey = `${item.teacherId}@${item.day}`;
      teacherDailyCount[tdKey] = (teacherDailyCount[tdKey] || 0) + 1;
    });

    // Soft 1: Sobrecarga diária de docente
    Object.entries(teacherDailyCount).forEach(([key, count]) => {
      const [tId, day] = key.split('@');
      const tch = teachers.find(t => t.id === tId);
      if (tch && count > (tch.maxDailySlots || 4)) {
        softScore -= weights.softOverload;
        violations.push({
          id: `v-ov-${key}`,
          severity: 'SOFT',
          title: 'Sobrecarga Diária Docente',
          detail: `${tch.name} possui ${count} blocos na ${day} (limite recomendado: ${tch.maxDailySlots}).`,
          targetType: 'teacher',
          targetId: tId
        });
      }
    });

    // Soft 2: Janelas/Buracos na grade das turmas ou aulas práticas isoladas
    classes.forEach(cls => {
      DAYS.forEach(day => {
        const dayAllocs = currentSchedule.filter(a => a.classId === cls.id && a.day === day);
        if (dayAllocs.length === 1) {
          const sub = subjects.find(s => s.id === dayAllocs[0].subjectId);
          if (sub?.isPractical) {
            softScore -= weights.softPracticalSplit;
            violations.push({
              id: `v-prac-${cls.id}-${day}`,
              severity: 'SOFT',
              title: 'Aula Prática Isolada',
              detail: `Turma ${cls.code} tem apenas 1 bloco prático de "${sub.name}" na ${day} (ideal: 2 blocos contínuos).`,
              targetType: 'class',
              targetId: cls.id
            });
          } else {
            softScore -= weights.softGap;
          }
        }
      });
    });

    return { hardScore, softScore, violations, conflictingIds };
  }, [currentSchedule, classes, subjects, teachers, rooms, weights]);

  // ==========================================================================
  // MOTOR DE OTIMIZAÇÃO INTELIGENTE (SOLVER TIMEFOLD HEURÍSTICO MULTI-ITERAÇÃO)
  // ==========================================================================
  const runTimefoldAutoSolver = () => {
    if (!canRunSolver) {
      showToast('Apenas o Coordenador Pedagógico (Admin) pode executar o Solver IA.', 'error');
      return;
    }

    setIsSolving(true);
    setSolverProgress(10);

    setTimeout(() => {
      // Monta lista de demandas de aulas pendentes com base nas UCs vinculadas às turmas
      const demands = [];
      classes.forEach(cls => {
        cls.subjectIds.forEach(subId => {
          const sub = subjects.find(s => s.id === subId);
          if (!sub) return;
          const alreadyAllocated = currentSchedule.filter(a => a.classId === cls.id && a.subjectId === subId).length;
          const needed = Math.max(0, (sub.weeklySlots || 2) - alreadyAllocated);
          for (let i = 0; i < needed; i++) {
            demands.push({ classObj: cls, subjectObj: sub });
          }
        });
      });

      if (demands.length === 0) {
        setIsSolving(false);
        setSolverProgress(100);
        showToast('Todas as UCs das turmas já possuem carga semanal alocada!', 'info');
        return;
      }

      let bestSchedule = [...currentSchedule];
      let bestEvalScore = -Infinity;

      // Executa 5 passadas heurísticas para encontrar a melhor combinação sem conflitos Hard
      const iterations = 5;
      for (let iter = 0; iter < iterations; iter++) {
        let candidateSchedule = [...currentSchedule];
        const shuffledDemands = [...demands].sort(() => (iter === 0 ? 0 : Math.random() - 0.5));

        shuffledDemands.forEach(({ classObj, subjectObj }) => {
          // Filtra docentes habilitados no eixo da UC
          const eligibleTeachers = teachers.filter(t => t.eixos.includes(subjectObj.eixo));
          const teacherPool = eligibleTeachers.length > 0 ? eligibleTeachers : teachers;

          // Filtra salas compatíveis com o tipo exigido e capacidade
          const eligibleRooms = rooms.filter(r =>
            (subjectObj.reqType === 'SALA_TEORIA' || r.type === subjectObj.reqType) &&
            r.capacity >= classObj.size
          );
          const roomPool = eligibleRooms.length > 0 ? eligibleRooms : rooms;

          // Prioriza períodos do turno da turma
          const preferredPeriods = PERIODS.filter(p => p.turn === classObj.shift);
          const otherPeriods = PERIODS.filter(p => p.turn !== classObj.shift);
          const orderedPeriods = [...preferredPeriods, ...otherPeriods];

          let bestSlotChoice = null;
          let lowestSlotCost = Infinity;

          for (const day of DAYS) {
            for (const period of orderedPeriods) {
              const slotKey = `${day}-${period.id}`;
              // Verifica se a turma já está ocupada neste slot
              if (candidateSchedule.some(a => a.classId === classObj.id && a.day === day && a.periodId === period.id)) {
                continue;
              }

              for (const tch of teacherPool) {
                if (tch.unavailable?.includes(slotKey)) continue;
                if (candidateSchedule.some(a => a.teacherId === tch.id && a.day === day && a.periodId === period.id)) {
                  continue;
                }

                for (const rm of roomPool) {
                  if (candidateSchedule.some(a => a.roomId === rm.id && a.day === day && a.periodId === period.id)) {
                    continue;
                  }

                  // Calcula custo heurístico deste encaixe
                  let cost = 0;
                  if (period.turn !== classObj.shift) cost += 50; // Penaliza fora do turno da turma
                  if (rm.capacity < classObj.size) cost += 200;
                  if (subjectObj.reqType !== 'SALA_TEORIA' && rm.type !== subjectObj.reqType) cost += 300;

                  // Bônus (custo negativo) se agrupar com outra aula da mesma turma no mesmo dia
                  const sameDayClass = candidateSchedule.filter(a => a.classId === classObj.id && a.day === day);
                  if (sameDayClass.length === 1) {
                    cost -= 25;
                    if (sameDayClass[0].subjectId === subjectObj.id && subjectObj.isPractical) {
                      cost -= 30; // Agrupa bloco prático contínuo
                    }
                  }

                  if (cost < lowestSlotCost) {
                    lowestSlotCost = cost;
                    bestSlotChoice = {
                      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      classId: classObj.id,
                      subjectId: subjectObj.id,
                      teacherId: tch.id,
                      roomId: rm.id,
                      day,
                      periodId: period.id
                    };
                  }
                }
              }
            }
          }

          if (bestSlotChoice) {
            candidateSchedule.push(bestSlotChoice);
          }
        });

        // Avalia qualidade total da solução gerada nesta iteração
        const totalScore = candidateSchedule.length * 1000;
        if (totalScore > bestEvalScore) {
          bestEvalScore = totalScore;
          bestSchedule = candidateSchedule;
        }
      }

      const addedCount = bestSchedule.length - currentSchedule.length;
      updateCurrentSchedule(bestSchedule, `Timefold AI Solver executado: +${addedCount} blocos alocados automaticamente.`);
      setIsSolving(false);
      setSolverProgress(100);
      showToast(`Otimização concluída! ${addedCount} novos blocos de aula alocados.`, 'success');
    }, 600);
  };

  // ==========================================================================
  // DRAG AND DROP NA GRADE
  // ==========================================================================
  const handleDragStart = (e, allocId) => {
    if (!canEditSchedule) {
      e.preventDefault();
      showToast('Seu perfil não tem permissão para mover aulas.', 'error');
      return;
    }
    setDraggedItemId(allocId);
    e.dataTransfer.setData('text/plain', allocId);
  };

  const handleDropOnCell = (e, targetDay, targetPeriodId) => {
    e.preventDefault();
    if (!draggedItemId || !canEditSchedule) return;

    const draggedAlloc = currentSchedule.find(a => a.id === draggedItemId);
    if (!draggedAlloc) return;
    if (draggedAlloc.day === targetDay && draggedAlloc.periodId === targetPeriodId) {
      setDraggedItemId(null);
      return;
    }

    const updated = currentSchedule.map(a =>
      a.id === draggedItemId ? { ...a, day: targetDay, periodId: targetPeriodId } : a
    );

    const sub = subjects.find(s => s.id === draggedAlloc.subjectId);
    updateCurrentSchedule(updated, `Aula "${sub?.name || 'UC'}" movida para ${targetDay} (${targetPeriodId}).`);
    setDraggedItemId(null);
  };

  // ==========================================================================
  // EXPORTAÇÕES OFICIAIS (CSV TOTVS / SGE, RELATÓRIO ALMOXARIFADO, JSON)
  // ==========================================================================
  const exportTOTVSCSV = () => {
    const headers = ['Semestre', 'Regional', 'Unidade_SENAI', 'Dia_Semana', 'Bloco_Horario', 'Turno', 'Cod_Turma', 'Turma', 'Modalidade', 'Cod_UC', 'Unidade_Curricular', 'Matricula_Docente', 'Docente', 'Ambiente_Oficina', 'Norma_NR'];
    const rows = currentSchedule.map(item => {
      const cls = classes.find(c => c.id === item.classId);
      const sub = subjects.find(s => s.id === item.subjectId);
      const tch = teachers.find(t => t.id === item.teacherId);
      const rm = rooms.find(r => r.id === item.roomId);
      const per = PERIODS.find(p => p.id === item.periodId);
      return [
        selectedSemester,
        selectedDR,
        `"${selectedUnit}"`,
        item.day,
        `"${per?.time || item.periodId}"`,
        per?.turn || '',
        cls?.code || '',
        `"${cls?.name || ''}"`,
        cls?.modality || '',
        sub?.code || '',
        `"${sub?.name || ''}"`,
        tch?.reg || '',
        `"${tch?.name || ''}"`,
        `"${rm?.name || ''}"`,
        `"${rm?.nr || ''}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SGE_TOTVS_SENAI_${selectedDR}_${selectedSemester}.csv`;
    a.click();
    addAuditLog(`Exportada planilha oficial SGE/TOTVS (${selectedSemester}).`);
    showToast('Arquivo CSV padrão SGE/TOTVS exportado!', 'success');
  };

  const exportWorkshopsCSV = () => {
    const headers = ['Ambiente_Oficina', 'Tipo', 'Norma_NR', 'Capacidade_Postos', 'Blocos_Semanais_Alocados', 'Taxa_Ocupacao_Percent', 'Unidade'];
    const totalPossible = DAYS.length * PERIODS.length;
    const rows = rooms.map(rm => {
      const count = currentSchedule.filter(a => a.roomId === rm.id).length;
      const pct = ((count / totalPossible) * 100).toFixed(1);
      return [`"${rm.name}"`, rm.type, `"${rm.nr}"`, rm.capacity, count, `${pct}%`, `"${rm.unit}"`].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_Oficinas_Insumos_SENAI_${selectedSemester}.csv`;
    a.click();
    addAuditLog('Exportado relatório de ocupação de oficinas e almoxarifado.');
    showToast('Relatório de Oficinas & Insumos exportado!', 'success');
  };

  const exportBackupJSON = () => {
    const payload = { teachers, rooms, subjects, classes, schedulesBySemester, snapshots, weights, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_SENAI_Timetable_${selectedDR}_${selectedSemester}.json`;
    a.click();
    showToast('Backup completo JSON gerado!', 'success');
  };

  const handleImportJSON = (e) => {
    if (!canManageEntities) {
      showToast('Apenas o Coordenador Pedagógico pode importar backups.', 'error');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.teachers) setTeachers(parsed.teachers);
        if (parsed.rooms) setRooms(parsed.rooms);
        if (parsed.subjects) setSubjects(parsed.subjects);
        if (parsed.classes) setClasses(parsed.classes);
        if (parsed.schedulesBySemester) setSchedulesBySemester(parsed.schedulesBySemester);
        addAuditLog('Backup JSON restaurado no sistema.');
        showToast('Backup JSON importado com sucesso!', 'success');
      } catch (err) {
        showToast('Arquivo JSON inválido.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // ==========================================================================
  // DADOS FILTRADOS PARA VISUALIZAÇÃO
  // ==========================================================================
  const filteredClasses = useMemo(() => {
    if (filterModality === 'all') return classes;
    return classes.filter(c => c.modality === filterModality);
  }, [classes, filterModality]);

  // Garante que selectedEntityId sempre aponte para um item válido ao trocar o modo/filtro
  useEffect(() => {
    if (viewMode === 'class') {
      if (!filteredClasses.some(c => c.id === selectedEntityId)) {
        setSelectedEntityId(filteredClasses[0]?.id || '');
      }
    } else if (viewMode === 'teacher') {
      if (!teachers.some(t => t.id === selectedEntityId)) {
        setSelectedEntityId(teachers[0]?.id || '');
      }
    } else if (viewMode === 'room') {
      if (!rooms.some(r => r.id === selectedEntityId)) {
        setSelectedEntityId(rooms[0]?.id || '');
      }
    }
  }, [viewMode, filteredClasses, teachers, rooms, selectedEntityId]);

  // ==========================================================================
  // ANALYTICS CALCULATIONS
  // ==========================================================================
  const analyticsData = useMemo(() => {
    const totalSlotsWeek = DAYS.length * PERIODS.length; // 30 blocos/semana

    const roomStats = rooms.map(rm => {
      const count = currentSchedule.filter(a => a.roomId === rm.id).length;
      return {
        ...rm,
        used: count,
        pct: Math.min(100, Math.round((count / totalSlotsWeek) * 100))
      };
    }).sort((a, b) => b.pct - a.pct);

    const teacherStats = teachers.map(tch => {
      const count = currentSchedule.filter(a => a.teacherId === tch.id).length;
      const hours = count * 2; // Cada bloco = 2h/aula
      return {
        ...tch,
        blocks: count,
        hours,
        pct: Math.min(100, Math.round((count / 20) * 100))
      };
    }).sort((a, b) => b.blocks - a.blocks);

    const modalityStats = MODALIDADES.map(mod => {
      const modClassIds = classes.filter(c => c.modality === mod.id).map(c => c.id);
      const count = currentSchedule.filter(a => modClassIds.includes(a.classId)).length;
      return { ...mod, count };
    });

    return { roomStats, teacherStats, modalityStats };
  }, [rooms, teachers, classes, currentSchedule]);

  // ==========================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col font-sans">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-bounce ${
          toastMessage.type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
          'bg-[#005A9C] text-white border-blue-800'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CABEÇALHO CORPORATIVO SENAI                                          */}
      {/* ==================================================================== */}
      <header className="bg-[#005A9C] text-white shadow-lg border-b-4 border-[#F37021] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* LOGO & TITULO */}
          <div className="flex items-center gap-3">
            <div className="bg-white px-3 py-1.5 rounded-md shadow flex items-center gap-1.5">
              <span className="font-black text-2xl tracking-tighter text-[#005A9C]">SENAI</span>
              <span className="bg-[#F37021] text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                AI Studio
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg leading-tight">
                  Gestão de Grade Horária & Ambientes
                </h1>
                {/* INDICADOR NUVEM FIREBASE */}
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  syncStatus === 'synced' ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40' :
                  syncStatus === 'saving' ? 'bg-amber-900/60 text-amber-200 border-amber-500/40' :
                  'bg-slate-800/80 text-slate-300 border-slate-600'
                }`}>
                  <Database className="w-3 h-3" />
                  {syncStatus === 'synced' ? 'Sincronizado na Nuvem' : syncStatus === 'saving' ? 'Salvando...' : 'Modo Local'}
                </span>
              </div>
              <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#F37021]" />
                {REGIONAL_DEPARTMENTS.find(d => d.code === selectedDR)?.name} • {selectedUnit}
              </p>
            </div>
          </div>

          {/* SELETORES INSTITUCIONAIS & SSO RBAC */}
          <div className="flex flex-wrap items-center gap-2">
            {/* REGIONAL */}
            <select
              value={selectedDR}
              onChange={(e) => {
                const dr = e.target.value;
                setSelectedDR(dr);
                const firstU = REGIONAL_DEPARTMENTS.find(d => d.code === dr)?.units[0] || '';
                setSelectedUnit(firstU);
              }}
              className="bg-blue-950/80 text-white text-xs rounded-md border border-blue-700 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
            >
              {REGIONAL_DEPARTMENTS.map(dr => (
                <option key={dr.code} value={dr.code}>{dr.code}</option>
              ))}
            </select>

            {/* UNIDADE SENAI */}
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-blue-950/80 text-white text-xs rounded-md border border-blue-700 px-2.5 py-1.5 max-w-[210px] truncate focus:outline-none focus:ring-2 focus:ring-[#F37021]"
            >
              {REGIONAL_DEPARTMENTS.find(d => d.code === selectedDR)?.units.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* SEMESTRE LETIVO */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="bg-blue-950/80 text-amber-300 font-bold text-xs rounded-md border border-blue-700 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#F37021]"
            >
              {SEMESTERS.map(sem => (
                <option key={sem} value={sem}>Semestre {sem}</option>
              ))}
            </select>

            {/* PERFIL DE ACESSO RBAC (SSO CORPORATIVO) */}
            <div className="flex items-center gap-1.5 bg-blue-950 border border-blue-700 px-2.5 py-1 rounded-md">
              {currentRole === 'admin' ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <select
                value={currentRole}
                onChange={(e) => {
                  setCurrentRole(e.target.value);
                  showToast(`Perfil alterado para: ${ROLES.find(r => r.id === e.target.value)?.label}`);
                }}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {ROLES.map(r => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* BARRA DE SCORE TIMEFOLD AI & AÇÕES RÁPIDAS                           */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* INDICADOR DE SCORE */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score Timefold AI:</span>
              <div className={`px-3 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-2 border ${
                evaluation.hardScore === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                {evaluation.hardScore === 0
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  : <ShieldAlert className="w-4 h-4 text-rose-600" />}
                <span>{evaluation.hardScore} Hard</span>
                <span className="text-slate-300">|</span>
                <span className="text-amber-700">{evaluation.softScore} Soft</span>
              </div>
            </div>

            {evaluation.violations.length > 0 && (
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{evaluation.violations.length} alerta(s) de regra — Ver detalhes</span>
              </button>
            )}
          </div>

          {/* BOTÕES DE OTIMIZAÇÃO E CONTROLE */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-slate-50">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title="Desfazer última alteração"
                className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-300" />
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="Refazer alteração"
                className="p-1.5 text-slate-600 hover:bg-slate-200 disabled:opacity-30 transition-colors"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {currentRole === 'teacher' && (
              <button
                onClick={() => setTeacherRequestModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Solicitar Troca / Manutenção
              </button>
            )}

            <button
              onClick={runTimefoldAutoSolver}
              disabled={isSolving || !canRunSolver}
              title={!canRunSolver ? 'Restrito ao Coordenador Pedagógico (Admin)' : 'Alocar UCs automaticamente'}
              className="bg-[#F37021] hover:bg-orange-600 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold px-4 py-1.5 rounded-md shadow-sm flex items-center gap-1.5 transition-all"
            >
              {isSolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isSolving ? 'Otimizando Matriz...' : 'Otimizar Grade (Timefold AI)'}
            </button>

            {canManageEntities && (
              <button
                onClick={handleResetToSenaiDefault}
                title="Restaurar dados padrão SENAI Ceará"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-md border border-slate-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* NAVEGAÇÃO PRINCIPAL POR ABAS                                         */}
      {/* ==================================================================== */}
      <nav className="bg-slate-200/80 border-b border-slate-300 px-4 pt-2 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex space-x-1 min-w-max">
          {[
            { id: 'grid', label: 'Grade Interativa', icon: Calendar },
            { id: 'classes', label: 'Turmas & Ofertas', icon: GraduationCap, count: classes.length },
            { id: 'teachers', label: 'Corpo Docente', icon: Users, count: teachers.length },
            { id: 'rooms', label: 'Ambientes & Oficinas', icon: Wrench, count: rooms.length },
            { id: 'subjects', label: 'Unidades Curriculares (UCs)', icon: BookOpen, count: subjects.length },
            { id: 'analytics', label: 'Analytics & Ocupação', icon: BarChart3 },
            { id: 'audit', label: 'Auditoria, Notificações & TOTVS', icon: Bell, badge: notifications.filter(n => n.status === 'Pendente').length }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg border-t border-x transition-all ${
                  active
                    ? 'bg-white text-[#005A9C] border-slate-300 shadow-sm -mb-px'
                    : 'bg-slate-100/60 text-slate-600 border-transparent hover:bg-white/60 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
                {tab.badge > 0 && (
                  <span className="bg-[#F37021] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ==================================================================== */}
      {/* ÁREA DE CONTEÚDO DAS ABAS                                            */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">

        {/* ------------------------------------------------------------------ */}
        {/* ABA 1: GRADE INTERATIVA (ESTILO TIMEEDIT + DRAG & DROP)            */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'grid' && (
          <div className="space-y-4">
            {/* BARRA DE FILTROS E SNAPSHOTS */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* MODO DE VISUALIZAÇÃO */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {[
                    { id: 'class', label: 'Por Turma' },
                    { id: 'teacher', label: 'Por Docente' },
                    { id: 'room', label: 'Por Ambiente/Oficina' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setViewMode(m.id)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        viewMode === m.id ? 'bg-[#005A9C] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* FILTRO DE MODALIDADE (QUANDO POR TURMA) */}
                {viewMode === 'class' && (
                  <select
                    value={filterModality}
                    onChange={(e) => setFilterModality(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    <option value="all">Todas as Modalidades</option>
                    {MODALIDADES.map(mod => (
                      <option key={mod.id} value={mod.id}>{mod.short}</option>
                    ))}
                  </select>
                )}

                {/* SELETOR DA ENTIDADE ESPECÍFICA */}
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="bg-blue-50/60 border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-bold text-[#005A9C] max-w-xs sm:max-w-md"
                >
                  {viewMode === 'class' && filteredClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name} ({c.shift})</option>
                  ))}
                  {viewMode === 'teacher' && teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} [{t.reg}]</option>
                  ))}
                  {viewMode === 'room' && rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.nr} • {r.capacity} postos)</option>
                  ))}
                </select>
              </div>

              {/* CENÁRIOS / SNAPSHOTS & LIMPAR */}
              <div className="flex flex-wrap items-center gap-2">
                {canEditSchedule && (
                  <>
                    <button
                      onClick={() => setSnapshotModalOpen(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5 text-[#005A9C]" /> Salvar Cenário ({snapshots.length})
                    </button>
                    <button
                      onClick={() => updateCurrentSchedule([], `Grade do semestre ${selectedSemester} limpa manualmente.`)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Limpar Grade
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* BARRA DE CENÁRIOS SALVOS (CHIPS) */}
            {snapshots.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Cenários Salvos:
                </span>
                {snapshots.map(snap => (
                  <button
                    key={snap.id}
                    onClick={() => {
                      updateCurrentSchedule(snap.schedule, `Restaurado cenário "${snap.name}".`);
                      showToast(`Cenário "${snap.name}" carregado na grade.`);
                    }}
                    className="bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>{snap.name}</span>
                    <span className="text-[10px] text-slate-400">({snap.schedule.length} aulas)</span>
                  </button>
                ))}
              </div>
            )}

            {/* TABELA SEMANAL INTERATIVA */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[880px]">
                  <thead>
                    <tr className="bg-[#005A9C] text-white text-xs">
                      <th className="p-3 text-left font-bold w-40 border-r border-blue-800">
                        Bloco / Horário
                      </th>
                      {DAYS.map(day => (
                        <th key={day} className="p-3 text-center font-bold border-r border-blue-800 last:border-r-0">
                          {day}-feira
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {PERIODS.map(period => {
                      // Verifica se o docente selecionado marcou indisponibilidade neste bloco
                      const activeTeacher = viewMode === 'teacher' ? teachers.find(t => t.id === selectedEntityId) : null;

                      return (
                        <tr key={period.id} className="hover:bg-slate-50/70">
                          <td className="p-3 bg-slate-50 border-r border-slate-200 align-middle">
                            <div className="font-bold text-slate-800 flex items-center justify-between">
                              <span>{period.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                period.turn === 'Manhã' ? 'bg-amber-100 text-amber-800' :
                                period.turn === 'Tarde' ? 'bg-sky-100 text-sky-800' :
                                'bg-indigo-100 text-indigo-800'
                              }`}>
                                {period.turn}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{period.time}</div>
                          </td>

                          {DAYS.map(day => {
                            const slotKey = `${day}-${period.id}`;
                            const isTeacherBlocked = activeTeacher?.unavailable?.includes(slotKey);

                            const cellItems = currentSchedule.filter(item => {
                              if (item.day !== day || item.periodId !== period.id) return false;
                              if (viewMode === 'class') return item.classId === selectedEntityId;
                              if (viewMode === 'teacher') return item.teacherId === selectedEntityId;
                              if (viewMode === 'room') return item.roomId === selectedEntityId;
                              return false;
                            });

                            return (
                              <td
                                key={day}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDropOnCell(e, day, period.id)}
                                onClick={() => {
                                  if (cellItems.length === 0 && canEditSchedule) {
                                    setAllocModal({ open: true, day, periodId: period.id });
                                  }
                                }}
                                className={`p-2 border-r border-slate-200 last:border-r-0 h-28 align-top relative transition-colors ${
                                  isTeacherBlocked ? 'bg-rose-50/70' :
                                  cellItems.length === 0 && canEditSchedule ? 'cursor-pointer hover:bg-blue-50/50 group' : ''
                                }`}
                              >
                                {isTeacherBlocked && cellItems.length === 0 && (
                                  <div className="h-full flex flex-col items-center justify-center text-rose-500 text-[10px] font-semibold border border-dashed border-rose-300 rounded-lg p-1 text-center">
                                    <Lock className="w-3.5 h-3.5 mb-0.5" />
                                    Docente Indisponível
                                  </div>
                                )}

                                {!isTeacherBlocked && cellItems.length === 0 && (
                                  <div className="h-full border-2 border-dashed border-transparent group-hover:border-blue-300 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-[#005A9C] transition-all">
                                    {canEditSchedule ? (
                                      <span className="flex items-center gap-1 text-[11px] font-semibold">
                                        <Plus className="w-4 h-4" /> Alocar
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-300">Livre</span>
                                    )}
                                  </div>
                                )}

                                <div className="space-y-1.5">
                                  {cellItems.map(item => {
                                    const cls = classes.find(c => c.id === item.classId);
                                    const sub = subjects.find(s => s.id === item.subjectId);
                                    const tch = teachers.find(t => t.id === item.teacherId);
                                    const rm = rooms.find(r => r.id === item.roomId);
                                    const mod = MODALIDADES.find(m => m.id === (cls?.modality || sub?.modality));
                                    const hasConflict = evaluation.conflictingIds.has(item.id);

                                    return (
                                      <div
                                        key={item.id}
                                        draggable={canEditSchedule}
                                        onDragStart={(e) => handleDragStart(e, item.id)}
                                        className={`p-2 rounded-lg border-l-4 shadow-xs relative group/card transition-all ${
                                          canEditSchedule ? 'cursor-grab active:cursor-grabbing' : ''
                                        } ${
                                          hasConflict
                                            ? 'bg-rose-50 border-rose-600 text-rose-950 ring-1 ring-rose-400'
                                            : mod?.card || 'bg-blue-50 border-blue-500 text-blue-950'
                                        }`}
                                      >
                                        {canEditSchedule && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              updateCurrentSchedule(
                                                currentSchedule.filter(a => a.id !== item.id),
                                                `Removida alocação de "${sub?.name}" em ${day} (${period.id}).`
                                              );
                                            }}
                                            title="Remover aula"
                                            className="absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 bg-white/90 hover:bg-rose-600 text-rose-600 hover:text-white p-1 rounded shadow-xs transition-all"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}

                                        <div className="flex items-center gap-1 mb-0.5">
                                          <span className="text-[9px] font-mono font-bold uppercase px-1 rounded bg-white/70 border border-black/10">
                                            {sub?.code}
                                          </span>
                                          {hasConflict && (
                                            <span className="text-[9px] font-bold bg-rose-600 text-white px-1 rounded">
                                              CONFLITO
                                            </span>
                                          )}
                                        </div>

                                        <div className="font-bold text-[11px] leading-snug pr-4 line-clamp-2">
                                          {sub?.name}
                                        </div>

                                        <div className="mt-1.5 pt-1 border-t border-black/10 text-[10px] space-y-0.5">
                                          {viewMode !== 'class' && (
                                            <div className="font-semibold truncate flex items-center gap-1">
                                              <GraduationCap className="w-3 h-3 shrink-0" /> {cls?.code}
                                            </div>
                                          )}
                                          {viewMode !== 'teacher' && (
                                            <div className="truncate flex items-center gap-1 opacity-90">
                                              <UserCheck className="w-3 h-3 shrink-0" /> {tch?.name}
                                            </div>
                                          )}
                                          {viewMode !== 'room' && (
                                            <div className="truncate flex items-center gap-1 font-medium text-[#005A9C]">
                                              <Wrench className="w-3 h-3 shrink-0" /> {rm?.name}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 2: TURMAS & OFERTAS EDUCACIONAIS (CRUD)                        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base text-slate-800">Turmas & Ofertas Educacionais</h2>
                <p className="text-xs text-slate-500">Ensino Médio SESI/SENAI, Cursos Técnicos, Graduação Tecnológica e Engenharias (IST)</p>
              </div>
              {canManageEntities && (
                <button
                  onClick={() => setCrudModal({ open: true, type: 'class', item: null })}
                  className="bg-[#005A9C] hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Nova Turma
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map(cls => {
                const mod = MODALIDADES.find(m => m.id === cls.modality);
                const allocatedBlocks = currentSchedule.filter(a => a.classId === cls.id).length;
                const expectedBlocks = cls.subjectIds.reduce((acc, sId) => {
                  const s = subjects.find(sub => sub.id === sId);
                  return acc + (s?.weeklySlots || 2);
                }, 0);

                return (
                  <div key={cls.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${mod?.badge}`}>
                          {mod?.short}
                        </span>
                        {canManageEntities && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCrudModal({ open: true, type: 'class', item: cls })}
                              className="p-1 text-slate-400 hover:text-[#005A9C] rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setClasses(classes.filter(c => c.id !== cls.id));
                                addAuditLog(`Turma "${cls.name}" excluída.`);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 mt-2">{cls.name}</h3>
                      <p className="text-xs font-mono text-slate-500">Cód: {cls.code} • Turno: {cls.shift}</p>

                      <div className="mt-3 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-600 block">UCs Vinculadas:</span>
                        <div className="flex flex-wrap gap-1">
                          {cls.subjectIds.map(sId => {
                            const s = subjects.find(sub => sub.id === sId);
                            return s ? (
                              <span key={sId} className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                                {s.code} ({s.weeklySlots}x)
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Alunos: <strong>{cls.size}</strong></span>
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        allocatedBlocks >= expectedBlocks ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Grade: {allocatedBlocks}/{expectedBlocks} blocos
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 3: CORPO DOCENTE & GRADE CLICÁVEL DE INDISPONIBILIDADE         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base text-slate-800">Corpo Docente & Disponibilidade</h2>
                <p className="text-xs text-slate-500">Clique nos blocos da mini-grade de cada docente para bloquear/liberar horários de indisponibilidade</p>
              </div>
              {canManageEntities && (
                <button
                  onClick={() => setCrudModal({ open: true, type: 'teacher', item: null })}
                  className="bg-[#005A9C] hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Novo Docente
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {teachers.map(tch => {
                const toggleAvailability = (day, periodId) => {
                  if (currentRole === 'supervisor') {
                    showToast('Supervisores não alteram disponibilidade docente.', 'error');
                    return;
                  }
                  const key = `${day}-${periodId}`;
                  const exists = tch.unavailable?.includes(key);
                  const updatedUnavailable = exists
                    ? tch.unavailable.filter(k => k !== key)
                    : [...(tch.unavailable || []), key];

                  setTeachers(teachers.map(t => t.id === tch.id ? { ...t, unavailable: updatedUnavailable } : t));
                  addAuditLog(`Atualizada disponibilidade do docente ${tch.name} (${key}).`);
                };

                return (
                  <div key={tch.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{tch.name}</h3>
                        <p className="text-xs font-mono text-slate-500">Matrícula: {tch.reg} • Máx: {tch.maxDailySlots} blocos/dia</p>
                      </div>
                      {canManageEntities && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCrudModal({ open: true, type: 'teacher', item: tch })}
                            className="p-1 text-slate-400 hover:text-[#005A9C]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTeachers(teachers.filter(t => t.id !== tch.id))}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {tch.eixos.map((eixo, idx) => (
                        <span key={idx} className="text-[10px] bg-blue-50 text-[#005A9C] border border-blue-200 px-2 py-0.5 rounded font-medium">
                          {eixo}
                        </span>
                      ))}
                    </div>

                    {/* MINI-GRADE CLICÁVEL DE INDISPONIBILIDADE */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                        Mapa de Disponibilidade Semanal (Clique para bloquear):
                      </span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600">
                              <th className="p-1 border border-slate-200">Bloco</th>
                              {DAYS.map(d => <th key={d} className="p-1 border border-slate-200">{d.slice(0, 3)}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {PERIODS.map(p => (
                              <tr key={p.id}>
                                <td className="p-1 font-mono font-bold bg-slate-50 border border-slate-200 text-center">{p.id}</td>
                                {DAYS.map(d => {
                                  const isBlocked = tch.unavailable?.includes(`${d}-${p.id}`);
                                  return (
                                    <td
                                      key={d}
                                      onClick={() => toggleAvailability(d, p.id)}
                                      className={`p-1 border border-slate-200 text-center cursor-pointer font-bold transition-colors ${
                                        isBlocked ? 'bg-rose-500 text-white' : 'bg-emerald-50 hover:bg-emerald-200 text-emerald-700'
                                      }`}
                                    >
                                      {isBlocked ? 'BLOQ' : 'OK'}
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
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 4: AMBIENTES & OFICINAS (CRUD + NRs)                           */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base text-slate-800">Ambientes Pedagógicos, Laboratórios & Oficinas</h2>
                <p className="text-xs text-slate-500">Controle de capacidade de postos de trabalho e Normas Regulamentadoras (NRs)</p>
              </div>
              {canManageEntities && (
                <button
                  onClick={() => setCrudModal({ open: true, type: 'room', item: null })}
                  className="bg-[#005A9C] hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Novo Ambiente / Oficina
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(rm => {
                const roomTypeLabel = ROOM_TYPES.find(rt => rt.id === rm.type)?.name || rm.type;
                return (
                  <div key={rm.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-700" /> {rm.nr}
                      </span>
                      {canManageEntities && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCrudModal({ open: true, type: 'room', item: rm })}
                            className="p-1 text-slate-400 hover:text-[#005A9C]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRooms(rooms.filter(r => r.id !== rm.id))}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{rm.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{roomTypeLabel}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Capacidade Máxima:</span>
                        <strong className="text-slate-800">{rm.capacity} postos/alunos</strong>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{rm.unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 5: UNIDADES CURRICULARES (UCs)                                 */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-base text-slate-800">Unidades Curriculares (UCs) & Componentes BNCC</h2>
                <p className="text-xs text-slate-500">Definição de carga horária, blocos semanais e tipo de ambiente obrigatório</p>
              </div>
              {canManageEntities && (
                <button
                  onClick={() => setCrudModal({ open: true, type: 'subject', item: null })}
                  className="bg-[#005A9C] hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Nova Unidade Curricular
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map(sub => {
                const mod = MODALIDADES.find(m => m.id === sub.modality);
                const reqLabel = ROOM_TYPES.find(rt => rt.id === sub.reqType)?.name || sub.reqType;
                return (
                  <div key={sub.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                          {sub.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${mod?.badge}`}>
                          {mod?.short}
                        </span>
                      </div>
                      {canManageEntities && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCrudModal({ open: true, type: 'subject', item: sub })}
                            className="p-1 text-slate-400 hover:text-[#005A9C]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSubjects(subjects.filter(s => s.id !== sub.id))}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{sub.name}</h3>

                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex justify-between">
                        <span>Carga Horária Total:</span>
                        <strong>{sub.hours}h ({sub.weeklySlots} blocos/sem)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Ambiente Obrigatório:</span>
                        <strong className="text-[#005A9C] truncate max-w-[160px]">{reqLabel}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        Eixo: {sub.eixo}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 6: ANALYTICS & OCUPAÇÃO DE OFICINAS                            */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* CARDS DE RESUMO */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">Blocos Alocados ({selectedSemester})</span>
                <div className="text-2xl font-black text-[#005A9C] mt-1">{currentSchedule.length}</div>
                <span className="text-[11px] text-slate-400">{currentSchedule.length * 2} horas/aula semanais</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">Taxa Média Oficinas/Labs</span>
                <div className="text-2xl font-black text-[#F37021] mt-1">
                  {Math.round(analyticsData.roomStats.reduce((a, b) => a + b.pct, 0) / (analyticsData.roomStats.length || 1))}%
                </div>
                <span className="text-[11px] text-slate-400">Base 30 blocos semanais/sala</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">Turmas Ativas</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{classes.length}</div>
                <span className="text-[11px] text-slate-400">{classes.reduce((a, b) => a + b.size, 0)} estudantes matriculados</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500">Conformidade de Regras</span>
                <div className={`text-2xl font-black mt-1 ${evaluation.hardScore === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {evaluation.hardScore === 0 ? '100%' : `${evaluation.violations.filter(v => v.severity === 'HARD').length} Falhas`}
                </div>
                <span className="text-[11px] text-slate-400">Validação Timefold AI</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GRÁFICO DE OCUPAÇÃO DE OFICINAS E LABORATÓRIOS */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Ocupação de Oficinas & Laboratórios (%)</h3>
                    <p className="text-xs text-slate-500">Planejamento de insumos, manutenção e almoxarifado</p>
                  </div>
                  <button
                    onClick={exportWorkshopsCSV}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded border border-slate-300 font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV Almoxarifado
                  </button>
                </div>

                <div className="space-y-3">
                  {analyticsData.roomStats.map(rm => (
                    <div key={rm.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700 truncate pr-2">{rm.name}</span>
                        <span className="font-mono font-bold text-[#005A9C] shrink-0">{rm.used}/30 blocos ({rm.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            rm.pct > 80 ? 'bg-rose-500' : rm.pct > 50 ? 'bg-[#F37021]' : 'bg-[#005A9C]'
                          }`}
                          style={{ width: `${rm.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARGA HORÁRIA SEMANAL POR DOCENTE & DISTRIBUIÇÃO MODALIDADE */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-900">Carga Horária Semanal por Docente</h3>
                  <div className="space-y-3">
                    {analyticsData.teacherStats.map(tch => (
                      <div key={tch.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700">{tch.name}</span>
                          <span className="font-mono font-bold text-emerald-700">{tch.hours}h/sem ({tch.blocks} blocos)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full"
                            style={{ width: `${tch.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h3 className="font-bold text-sm text-slate-900">Distribuição por Modalidade Educacional</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {analyticsData.modalityStats.map(m => (
                      <div key={m.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-semibold text-slate-600 truncate">{m.short}</div>
                        <div className="text-lg font-black text-slate-900 mt-0.5">{m.count} <span className="text-[10px] font-normal text-slate-500">blocos</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 7: AUDITORIA, NOTIFICAÇÕES, PESOS & INTEGRAÇÃO TOTVS           */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* PAINEL DE EXPORTAÇÃO OFICIAL TOTVS / SGE & BACKUP */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#005A9C]" />
                  Integração SGE SENAI / TOTVS Educacional & Backup
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exporte a matriz oficial para importação no ERP acadêmico ou salve backups completos em JSON
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={exportTOTVSCSV}
                  className="bg-[#005A9C] hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Exportar CSV TOTVS / SGE
                </button>
                <button
                  onClick={exportWorkshopsCSV}
                  className="bg-[#F37021] hover:bg-orange-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Wrench className="w-4 h-4" /> Relatório Oficinas / Insumos
                </button>
                <button
                  onClick={exportBackupJSON}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Backup JSON
                </button>
                {canManageEntities && (
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-4 h-4" /> Restaurar JSON
                    <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* COLUNA 1: CENTRAL DE SOLICITAÇÕES & NOTIFICAÇÕES */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#F37021]" /> Central de Solicitações & Alertas
                  </h3>
                  <button
                    onClick={() => setTeacherRequestModal(true)}
                    className="text-[11px] font-bold text-[#005A9C] hover:underline"
                  >
                    + Nova Solicitação
                  </button>
                </div>

                <div className="space-y-2.5 max-h-96 overflow-y-auto">
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{notif.type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          notif.status === 'Pendente' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {notif.status}
                        </span>
                      </div>
                      <p className="text-slate-600">{notif.message}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>{notif.from} • {notif.time}</span>
                        {notif.status === 'Pendente' && canEditSchedule && (
                          <button
                            onClick={() => {
                              setNotifications(notifications.map(n => n.id === notif.id ? { ...n, status: 'Atendido' } : n));
                              addAuditLog(`Solicitação de "${notif.from}" marcada como atendida.`);
                              showToast('Notificação enviada ao docente via WhatsApp/E-mail corporativo!', 'success');
                            }}
                            className="text-emerald-700 font-bold hover:underline"
                          >
                            Aprovar & Notificar Docente
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUNA 2: DIAGNÓSTICO DE CONFLITOS & CONFIGURAÇÃO DE PESOS */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Conflitos Detectados ({evaluation.violations.length})
                </h3>

                {evaluation.violations.length === 0 ? (
                  <div className="p-6 text-center bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                    Nenhuma violação de regra detectada nesta grade!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {evaluation.violations.map(v => (
                      <div
                        key={v.id}
                        onClick={() => {
                          setViewMode(v.targetType);
                          setSelectedEntityId(v.targetId);
                          setActiveTab('grid');
                        }}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer hover:opacity-90 transition-opacity ${
                          v.severity === 'HARD' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{v.title}</span>
                          <span className="text-[10px] underline">Ver na Grade →</span>
                        </div>
                        <p className="text-[11px] mt-0.5 opacity-90">{v.detail}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* AJUSTE DE PESOS DO SOLVER */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5" /> Calibração de Penalidades (Solver IA)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <label className="flex flex-col">
                      <span className="text-slate-500">Choque Hard:</span>
                      <input
                        type="number"
                        disabled={!canManageEntities}
                        value={weights.hardConflict}
                        onChange={(e) => setWeights({ ...weights, hardConflict: Number(e.target.value) })}
                        className="border border-slate-300 rounded px-2 py-1 font-mono"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-slate-500">Ambiente Incompatível:</span>
                      <input
                        type="number"
                        disabled={!canManageEntities}
                        value={weights.hardRoomType}
                        onChange={(e) => setWeights({ ...weights, hardRoomType: Number(e.target.value) })}
                        className="border border-slate-300 rounded px-2 py-1 font-mono"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-slate-500">Prática Isolada (Soft):</span>
                      <input
                        type="number"
                        disabled={!canManageEntities}
                        value={weights.softPracticalSplit}
                        onChange={(e) => setWeights({ ...weights, softPracticalSplit: Number(e.target.value) })}
                        className="border border-slate-300 rounded px-2 py-1 font-mono"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-slate-500">Janela/Buraco (Soft):</span>
                      <input
                        type="number"
                        disabled={!canManageEntities}
                        value={weights.softGap}
                        onChange={(e) => setWeights({ ...weights, softGap: Number(e.target.value) })}
                        className="border border-slate-300 rounded px-2 py-1 font-mono"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* COLUNA 3: LOG DE AUDITORIA EM TEMPO REAL */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#005A9C]" /> Trilha de Auditoria (Tempo Real)
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto text-xs">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span className="text-[#005A9C]">{log.role}</span>
                        <span className="font-mono">{log.time}</span>
                      </div>
                      <p className="text-slate-700 mt-1">{log.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL 1: ALOCAÇÃO RÁPIDA DE AULA NA GRADE                            */}
      {/* ==================================================================== */}
      {allocModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#005A9C] text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Alocar Bloco de Aula</h3>
                <p className="text-xs text-blue-200">{allocModal.day}-feira • Bloco {allocModal.periodId}</p>
              </div>
              <button onClick={() => setAllocModal({ open: false, day: '', periodId: '' })} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const classId = fd.get('classId');
                const subjectId = fd.get('subjectId');
                const teacherId = fd.get('teacherId');
                const roomId = fd.get('roomId');

                const newAlloc = {
                  id: `man-${Date.now()}`,
                  classId,
                  subjectId,
                  teacherId,
                  roomId,
                  day: allocModal.day,
                  periodId: allocModal.periodId
                };

                const sub = subjects.find(s => s.id === subjectId);
                updateCurrentSchedule(
                  [...currentSchedule, newAlloc],
                  `Alocada manualmente UC "${sub?.name}" em ${allocModal.day} (${allocModal.periodId}).`
                );
                setAllocModal({ open: false, day: '', periodId: '' });
                showToast('Aula alocada na grade!', 'success');
              }}
              className="p-5 space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Turma:</label>
                <select
                  name="classId"
                  defaultValue={viewMode === 'class' ? selectedEntityId : classes[0]?.id}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-medium"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Unidade Curricular (UC):</label>
                <select
                  name="subjectId"
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-medium"
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Docente / Instrutor:</label>
                <select
                  name="teacherId"
                  defaultValue={viewMode === 'teacher' ? selectedEntityId : teachers[0]?.id}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-medium"
                >
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.reg})</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ambiente Pedagógico / Oficina:</label>
                <select
                  name="roomId"
                  defaultValue={viewMode === 'room' ? selectedEntityId : rooms[0]?.id}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-medium"
                >
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name} [{r.nr} • {r.capacity} postos]</option>)}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAllocModal({ open: false, day: '', periodId: '' })}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#005A9C] hover:bg-blue-800 text-white font-bold"
                >
                  Confirmar Alocação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: SALVAR CENÁRIO / SNAPSHOT                                   */}
      {/* ==================================================================== */}
      {snapshotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Salvar Cenário de Grade ({selectedSemester})</h3>
            <input
              type="text"
              placeholder="Ex: Matriz Oficial Pós-Ajuste NRs"
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setSnapshotModalOpen(false)} className="px-3 py-1.5 text-xs text-slate-600 border rounded-lg">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!newSnapshotName.trim()) return;
                  const newSnap = {
                    id: `snap-${Date.now()}`,
                    name: newSnapshotName.trim(),
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    semester: selectedSemester,
                    schedule: [...currentSchedule]
                  };
                  setSnapshots([newSnap, ...snapshots]);
                  addAuditLog(`Salvo novo cenário de grade: "${newSnap.name}".`);
                  setNewSnapshotName('');
                  setSnapshotModalOpen(false);
                  showToast('Cenário salvo com sucesso!', 'success');
                }}
                className="px-4 py-1.5 text-xs bg-[#005A9C] text-white font-bold rounded-lg"
              >
                Salvar Cenário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: SOLICITAÇÃO DE TROCA / MANUTENÇÃO (PERFIL DOCENTE)          */}
      {/* ==================================================================== */}
      {teacherRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-emerald-700 text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm">Registrar Solicitação à Coordenação</h3>
              <button onClick={() => setTeacherRequestModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const newNotif = {
                  id: `not-${Date.now()}`,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  from: fd.get('sender'),
                  type: fd.get('reqType'),
                  message: fd.get('message'),
                  status: 'Pendente'
                };
                setNotifications([newNotif, ...notifications]);
                addAuditLog(`Nova solicitação registrada por ${newNotif.from} (${newNotif.type}).`);
                setTeacherRequestModal(false);
                showToast('Solicitação enviada à Central de Notificações!', 'success');
              }}
              className="p-5 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Solicitante (Docente / Supervisor):</label>
                <select name="sender" className="w-full border border-slate-300 rounded-lg p-2">
                  {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo de Ocorrência:</label>
                <select name="reqType" className="w-full border border-slate-300 rounded-lg p-2">
                  <option value="Troca de Horário">Troca de Horário / Turno</option>
                  <option value="Manutenção de Oficina / Equipamento">Manutenção Preventiva em Oficina/Lab</option>
                  <option value="Atestado / Afastamento">Afastamento / Substituição Docente</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição Detalhada:</label>
                <textarea
                  name="message"
                  required
                  rows={3}
                  placeholder="Descreva o motivo e a sugestão de novo horário ou ambiente..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setTeacherRequestModal(false)} className="px-3 py-1.5 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg">Enviar Solicitação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: CRUD UNIFICADO (TURMAS, DOCENTES, AMBIENTES, UCs)           */}
      {/* ==================================================================== */}
      {crudModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#005A9C] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {crudModal.item ? 'Editar Registro' : 'Novo Cadastro'} —{' '}
                {crudModal.type === 'class' ? 'Turma SENAI' :
                 crudModal.type === 'teacher' ? 'Docente / Instrutor' :
                 crudModal.type === 'room' ? 'Ambiente / Oficina' : 'Unidade Curricular (UC)'}
              </h3>
              <button onClick={() => setCrudModal({ open: false, type: '', item: null })}><X className="w-5 h-5" /></button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);

                if (crudModal.type === 'class') {
                  const selectedSubs = Array.from(e.target.querySelectorAll('input[name="subIds"]:checked')).map(el => el.value);
                  const obj = {
                    id: crudModal.item?.id || `C-${Date.now()}`,
                    code: fd.get('code'),
                    name: fd.get('name'),
                    modality: fd.get('modality'),
                    shift: fd.get('shift'),
                    size: Number(fd.get('size')),
                    subjectIds: selectedSubs.length > 0 ? selectedSubs : [subjects[0]?.id].filter(Boolean)
                  };
                  setClasses(crudModal.item ? classes.map(c => c.id === obj.id ? obj : c) : [...classes, obj]);
                  addAuditLog(`Turma "${obj.name}" salva.`);
                }

                if (crudModal.type === 'teacher') {
                  const selectedEixos = Array.from(e.target.querySelectorAll('input[name="eixos"]:checked')).map(el => el.value);
                  const obj = {
                    id: crudModal.item?.id || `T-${Date.now()}`,
                    name: fd.get('name'),
                    reg: fd.get('reg'),
                    maxDailySlots: Number(fd.get('maxDailySlots')),
                    eixos: selectedEixos.length > 0 ? selectedEixos : [EIXOS_TECNOLOGICOS[0]],
                    unavailable: crudModal.item?.unavailable || []
                  };
                  setTeachers(crudModal.item ? teachers.map(t => t.id === obj.id ? obj : t) : [...teachers, obj]);
                  addAuditLog(`Docente "${obj.name}" salvo.`);
                }

                if (crudModal.type === 'room') {
                  const obj = {
                    id: crudModal.item?.id || `R-${Date.now()}`,
                    name: fd.get('name'),
                    type: fd.get('type'),
                    nr: fd.get('nr'),
                    capacity: Number(fd.get('capacity')),
                    unit: fd.get('unit')
                  };
                  setRooms(crudModal.item ? rooms.map(r => r.id === obj.id ? obj : r) : [...rooms, obj]);
                  addAuditLog(`Ambiente/Oficina "${obj.name}" salvo.`);
                }

                if (crudModal.type === 'subject') {
                  const obj = {
                    id: crudModal.item?.id || `S-${Date.now()}`,
                    code: fd.get('code'),
                    name: fd.get('name'),
                    hours: Number(fd.get('hours')),
                    weeklySlots: Number(fd.get('weeklySlots')),
                    modality: fd.get('modality'),
                    eixo: fd.get('eixo'),
                    reqType: fd.get('reqType'),
                    isPractical: fd.get('reqType') !== 'SALA_TEORIA' && fd.get('reqType') !== 'SALA_BNCC'
                  };
                  setSubjects(crudModal.item ? subjects.map(s => s.id === obj.id ? obj : s) : [...subjects, obj]);
                  addAuditLog(`Unidade Curricular "${obj.name}" salva.`);
                }

                setCrudModal({ open: false, type: '', item: null });
                showToast('Registro salvo e sincronizado!', 'success');
              }}
              className="p-5 space-y-3 text-xs max-h-[80vh] overflow-y-auto"
            >
              {/* FORMULÁRIO TURMA */}
              {crudModal.type === 'class' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Código da Turma:</label>
                      <input name="code" required defaultValue={crudModal.item?.code || 'TEC-2026-01'} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Nº de Alunos:</label>
                      <input name="size" type="number" required defaultValue={crudModal.item?.size || 24} className="w-full border rounded-lg p-2" />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Nome da Turma / Curso:</label>
                    <input name="name" required defaultValue={crudModal.item?.name || ''} placeholder="Ex: Técnico em Eletrotécnica 2026.1" className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Modalidade:</label>
                      <select name="modality" defaultValue={crudModal.item?.modality || 'tecnico'} className="w-full border rounded-lg p-2">
                        {MODALIDADES.map(m => <option key={m.id} value={m.id}>{m.short}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Turno Preferencial:</label>
                      <select name="shift" defaultValue={crudModal.item?.shift || 'Manhã'} className="w-full border rounded-lg p-2">
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Unidades Curriculares (UCs) da Matriz:</label>
                    <div className="border rounded-lg p-2 max-h-36 overflow-y-auto space-y-1 bg-slate-50">
                      {subjects.map(s => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="subIds"
                            value={s.id}
                            defaultChecked={crudModal.item?.subjectIds?.includes(s.id)}
                          />
                          <span>{s.code} - {s.name} ({s.weeklySlots} blocos/sem)</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* FORMULÁRIO DOCENTE */}
              {crudModal.type === 'teacher' && (
                <>
                  <div>
                    <label className="font-bold block mb-1">Nome Completo:</label>
                    <input name="name" required defaultValue={crudModal.item?.name || ''} className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Matrícula SENAI:</label>
                      <input name="reg" required defaultValue={crudModal.item?.reg || 'SENAI-CE-0000'} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Limite Blocos/Dia:</label>
                      <input name="maxDailySlots" type="number" min={1} max={6} required defaultValue={crudModal.item?.maxDailySlots || 4} className="w-full border rounded-lg p-2" />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Eixos Tecnológicos Habilitados:</label>
                    <div className="border rounded-lg p-2 max-h-36 overflow-y-auto space-y-1 bg-slate-50">
                      {EIXOS_TECNOLOGICOS.map(eixo => (
                        <label key={eixo} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="eixos"
                            value={eixo}
                            defaultChecked={crudModal.item?.eixos?.includes(eixo)}
                          />
                          <span>{eixo}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* FORMULÁRIO AMBIENTE / OFICINA */}
              {crudModal.type === 'room' && (
                <>
                  <div>
                    <label className="font-bold block mb-1">Nome do Ambiente / Oficina:</label>
                    <input name="name" required defaultValue={crudModal.item?.name || ''} placeholder="Ex: Oficina de Soldagem Industrial" className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Tipo de Ambiente:</label>
                      <select name="type" defaultValue={crudModal.item?.type || 'LAB_ROBOTICA'} className="w-full border rounded-lg p-2">
                        {ROOM_TYPES.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Norma Regulamentadora:</label>
                      <select name="nr" defaultValue={crudModal.item?.nr || 'NR-12'} className="w-full border rounded-lg p-2">
                        {NR_OPTIONS.map(nr => <option key={nr} value={nr}>{nr}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Capacidade (Postos):</label>
                      <input name="capacity" type="number" required defaultValue={crudModal.item?.capacity || 20} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Unidade SENAI:</label>
                      <input name="unit" required defaultValue={crudModal.item?.unit || selectedUnit} className="w-full border rounded-lg p-2" />
                    </div>
                  </div>
                </>
              )}

              {/* FORMULÁRIO UNIDADE CURRICULAR */}
              {crudModal.type === 'subject' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Código da UC:</label>
                      <input name="code" required defaultValue={crudModal.item?.code || 'UC-NEW-01'} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Modalidade:</label>
                      <select name="modality" defaultValue={crudModal.item?.modality || 'tecnico'} className="w-full border rounded-lg p-2">
                        {MODALIDADES.map(m => <option key={m.id} value={m.id}>{m.short}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Nome da Unidade Curricular:</label>
                    <input name="name" required defaultValue={crudModal.item?.name || ''} className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Carga Horária Total (h):</label>
                      <input name="hours" type="number" required defaultValue={crudModal.item?.hours || 80} className="w-full border rounded-lg p-2" />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Blocos Semanais:</label>
                      <input name="weeklySlots" type="number" min={1} max={10} required defaultValue={crudModal.item?.weeklySlots || 2} className="w-full border rounded-lg p-2" />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Eixo Tecnológico:</label>
                    <select name="eixo" defaultValue={crudModal.item?.eixo || EIXOS_TECNOLOGICOS[0]} className="w-full border rounded-lg p-2">
                      {EIXOS_TECNOLOGICOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Tipo de Ambiente Obrigatório:</label>
                    <select name="reqType" defaultValue={crudModal.item?.reqType || 'SALA_TEORIA'} className="w-full border rounded-lg p-2">
                      {ROOM_TYPES.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCrudModal({ open: false, type: '', item: null })}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#005A9C] hover:bg-blue-800 text-white font-bold"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* RODAPÉ INSTITUCIONAL                                                 */}
      {/* ==================================================================== */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-3.5 px-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">SENAI Timetable AI Studio</span>
            <span>•</span>
            <span>Sistema FIEC / SENAI Unidades Brasil</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Motor Heurístico Multi-Iteração (Timefold Spec) • Sincronização em Nuvem Ativa
          </div>
        </div>
      </footer>
    </div>
  );
}