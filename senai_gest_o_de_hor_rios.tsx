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
  Lock, Unlock, FileText, Printer, ChevronRight, AlertCircle, Info, Settings, Eye,
  HelpCircle, ArrowRight
} from 'lucide-react';

// ============================================================================
// INICIALIZAÇÃO DO FIREBASE (PERSISTÊNCIA EM NUVEM COM FALLBACK SEGURO)
// ============================================================================
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'senai-gestao-horarios';

// ============================================================================
// CONSTANTES INSTITUCIONAIS SENAI (DR-CE & DEPARTAMENTOS REGIONAIS DO BRASIL)
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
  { id: 'medio', name: 'Ensino Médio Integrado (SESI/SENAI - BNCC)', short: 'Ensino Médio BNCC', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300', card: 'bg-emerald-50/90 border-emerald-400 text-emerald-950' },
  { id: 'tecnico', name: 'Curso Técnico (Subsequente / Concomitante)', short: 'Técnico SENAI', badge: 'bg-sky-100 text-sky-900 border-sky-300', card: 'bg-sky-50/90 border-sky-400 text-sky-950' },
  { id: 'graduacao', name: 'Graduação Tecnológica (Superior SENAI)', short: 'Graduação Tec.', badge: 'bg-purple-100 text-purple-900 border-purple-300', card: 'bg-purple-50/90 border-purple-400 text-purple-950' },
  { id: 'engenharia', name: 'Engenharia / Bacharelado (IST SENAI)', short: 'Engenharia IST', badge: 'bg-amber-100 text-amber-900 border-amber-300', card: 'bg-amber-50/90 border-amber-400 text-amber-950' },
  { id: 'aprendizagem', name: 'Aprendizagem Industrial (Jovem Aprendiz)', short: 'Aprendizagem', badge: 'bg-indigo-100 text-indigo-900 border-indigo-300', card: 'bg-indigo-50/90 border-indigo-400 text-indigo-950' },
  { id: 'qualificacao', name: 'Qualificação Profissional', short: 'Qualificação', badge: 'bg-slate-200 text-slate-900 border-slate-300', card: 'bg-slate-100 border-slate-400 text-slate-950' }
];

const EIXOS_TECNOLOGICOS = [
  'Energias Renováveis & Hidrogênio Verde (H2V)',
  'Eletroeletrônica e Automação',
  'Metalmecânica e Usinagem',
  'Têxtil, Moda e Vestuário',
  'TI, Cibersegurança & IoT Industrial',
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
  { id: 'admin', label: 'Coordenador Pedagógico (Admin SENAI)', badge: 'bg-[#F37021] text-white' },
  { id: 'supervisor', label: 'Supervisor de Eixo / Oficina', badge: 'bg-[#0072CE] text-white' },
  { id: 'teacher', label: 'Docente / Instrutor SENAI', badge: 'bg-emerald-600 text-white' }
];

// ============================================================================
// BASE DE DADOS INSTITUCIONAL INICIAL (SENAI CEARÁ - DR-CE)
// ============================================================================
const SEED_TEACHERS = [
  { id: 'T1', name: 'Dr. Francisco Germano (IST)', reg: 'SENAI-CE-7740', eixos: ['Energias Renováveis & Hidrogênio Verde (H2V)', 'Eletroeletrônica e Automação'], maxDailySlots: 3, unavailable: ['Sexta-N2'] },
  { id: 'T2', name: 'Eng. Carlos Eduardo Souza', reg: 'SENAI-CE-8841', eixos: ['Eletroeletrônica e Automação'], maxDailySlots: 4, unavailable: ['Segunda-M1'] },
  { id: 'T3', name: 'Prof. Raimundo Nonato', reg: 'SENAI-CE-9120', eixos: ['Metalmecânica e Usinagem'], maxDailySlots: 4, unavailable: [] },
  { id: 'T4', name: 'Profa. Ana Teresa (SESI/SENAI)', reg: 'SESI-CE-1022', eixos: ['Formação Geral (BNCC SESI/SENAI)'], maxDailySlots: 4, unavailable: ['Quinta-T2'] },
  { id: 'T5', name: 'Profa. Ana Paula Castro', reg: 'SENAI-CE-1192', eixos: ['Têxtil, Moda e Vestuário'], maxDailySlots: 4, unavailable: [] },
  { id: 'T6', name: 'Prof. Lucas Vasconcelos', reg: 'SENAI-CE-5530', eixos: ['TI, Cibersegurança & IoT Industrial'], maxDailySlots: 4, unavailable: [] }
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
  { id: 'S6', code: 'UC-IOT-06', name: 'Desenvolvimento IoT e Indústria 4.0', hours: 60, weeklySlots: 2, reqType: 'LAB_TI', modality: 'tecnico', eixo: 'TI, Cibersegurança & IoT Industrial', isPractical: true },
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
  // ESTADOS E SINCRONIZAÇÃO NUVEM / LOCAL
  // ==========================================================================
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting'); // 'connecting' | 'synced' | 'saving' | 'offline'
  const isRemoteUpdate = useRef(false);

  // CONTEXTO INSTITUCIONAL SENAI
  const [selectedDR, setSelectedDR] = useState('DR-CE');
  const [selectedUnit, setSelectedUnit] = useState('SENAI Jacarecanga (CFP Waldyr Diogo)');
  const [selectedSemester, setSelectedSemester] = useState('2026.1');
  const [currentRole, setCurrentRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('grid');

  // DOMÍNIO PRINCIPAL
  const [teachers, setTeachers] = useState(SEED_TEACHERS);
  const [rooms, setRooms] = useState(SEED_ROOMS);
  const [subjects, setSubjects] = useState(SEED_SUBJECTS);
  const [classes, setClasses] = useState(SEED_CLASSES);
  const [schedulesBySemester, setSchedulesBySemester] = useState({
    '2026.1': SEED_SCHEDULE_2026_1,
    '2026.2': [],
    '2027.1': []
  });

  // HISTÓRICO UNDO / REDO
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // SNAPSHOTS DE CENÁRIOS
  const [snapshots, setSnapshots] = useState([
    { id: 'snap-1', name: 'Cenário Base Oficial 2026.1 (DR-CE)', timestamp: 'Hoje, 08:00', semester: '2026.1', schedule: SEED_SCHEDULE_2026_1 }
  ]);

  // AUDITORIA E NOTIFICAÇÕES
  const [auditLogs, setAuditLogs] = useState([
    { id: 'log-1', time: '08:15', role: 'Coordenador Pedagógico', action: 'Matriz 2026.1 inicializada com parâmetros FIEC / SENAI Ceará.' },
    { id: 'log-2', time: '09:30', role: 'Supervisor de Oficina', action: 'Conformidade NR-13 / NR-20 aprovada no IST Lab. Hidrogênio Verde.' }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 'not-1', time: '10:05', from: 'Dr. Francisco Germano (Docente IST)', type: 'Solicitação de Ajuste', message: 'Reserva do Lab de H2V nas segundas-feiras à noite para testes práticos de células de combustível.', status: 'Pendente' }
  ]);

  // PESOS DE RESTRIÇÃO TIMEFOLD
  const [weights, setWeights] = useState({
    hardConflict: 100,
    hardCapacity: 80,
    hardRoomType: 90,
    hardUnavailable: 100,
    softGap: 10,
    softPracticalSplit: 15,
    softOverload: 20
  });

  // FILTROS & INTERFACE
  const [viewMode, setViewMode] = useState('class'); // 'class' | 'teacher' | 'room'
  const [selectedEntityId, setSelectedEntityId] = useState('C1');
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  // MODAIS
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
    const roleLabel = ROLES.find(r => r.id === currentRole)?.label || 'Sistema SENAI';
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setAuditLogs(prev => [{ id: `log-${Date.now()}`, time: timeStr, role: roleLabel, action: actionText }, ...prev.slice(0, 49)]);
  }, [currentRole]);

  // ==========================================================================
  // SINCRONIZAÇÃO FIREBASE AUTH & FIRESTORE COM FALLBACK
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
        console.error('Erro Auth Firebase:', err);
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

  useEffect(() => {
    if (!user || !db) return;
    const stateDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'senai_gestao_horarios_state', 'master_v1');

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
        console.error('Erro Firestore:', error);
        setSyncStatus('offline');
      }
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !db || isRemoteUpdate.current) return;
    setSyncStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const stateDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'senai_gestao_horarios_state', 'master_v1');
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
        console.error('Erro salvamento:', err);
        setSyncStatus('offline');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [teachers, rooms, subjects, classes, schedulesBySemester, auditLogs, notifications, snapshots, weights, user]);

  // Grade ativa
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
      showToast('Apenas o Coordenador Pedagógico (Admin) pode restaurar a matriz.', 'error');
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
    addAuditLog('Base institucional SENAI Ceará restaurada pelo Administrador.');
    showToast('Base institucional restaurada com sucesso!', 'success');
  };

  // RBAC
  const canEditSchedule = currentRole === 'admin' || currentRole === 'supervisor';
  const canManageEntities = currentRole === 'admin';
  const canRunSolver = currentRole === 'admin';

  // ==========================================================================
  // MOTOR DE AVALIAÇÃO DE RESTRIÇÕES TIMEFOLD
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

      // 1. Choque Docente
      const tKey = `${item.teacherId}@${slotKey}`;
      if (teacherSlots[tKey]) {
        hardScore -= weights.hardConflict;
        conflictingIds.add(item.id);
        conflictingIds.add(teacherSlots[tKey]);
        violations.push({
          id: `v-t-${item.id}`,
          severity: 'HARD',
          title: 'Conflito de Docente Simultâneo',
          detail: `${tch?.name || 'Docente'} alocado em 2 turmas no mesmo horário (${item.day} - ${item.periodId}).`,
          targetType: 'teacher',
          targetId: item.teacherId
        });
      } else {
        teacherSlots[tKey] = item.id;
      }

      // 2. Choque Ambiente / Oficina
      const rKey = `${item.roomId}@${slotKey}`;
      if (roomSlots[rKey]) {
        hardScore -= weights.hardConflict;
        conflictingIds.add(item.id);
        conflictingIds.add(roomSlots[rKey]);
        violations.push({
          id: `v-r-${item.id}`,
          severity: 'HARD',
          title: 'Conflito de Laboratório / Oficina',
          detail: `${rm?.name || 'Ambiente'} ocupado por 2 turmas (${item.day} - ${item.periodId}).`,
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
          title: 'Choque de Turma Simultânea',
          detail: `Turma ${cls?.code || ''} possui 2 aulas alocadas em ${item.day} (${item.periodId}).`,
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
          title: 'Violação de Indisponibilidade Docente',
          detail: `${tch.name} possui bloqueio registrado para ${item.day} (${item.periodId}).`,
          targetType: 'teacher',
          targetId: item.teacherId
        });
      }

      // 5. Lotação de Postos de Trabalho vs Turma (Conformidade NR)
      if (cls && rm && cls.size > rm.capacity) {
        hardScore -= weights.hardCapacity;
        conflictingIds.add(item.id);
        violations.push({
          id: `v-cap-${item.id}`,
          severity: 'HARD',
          title: 'Excesso de Lotação (Norma de Segurança NR)',
          detail: `Turma ${cls.code} (${cls.size} alunos) excede a capacidade de ${rm.capacity} postos de ${rm.name} [${rm.nr}].`,
          targetType: 'room',
          targetId: item.roomId
        });
      }

      // 6. Incompatibilidade de Tipo de Laboratório Exigido pela UC
      if (sub && rm && sub.reqType !== 'SALA_TEORIA' && sub.reqType !== rm.type) {
        hardScore -= weights.hardRoomType;
        conflictingIds.add(item.id);
        violations.push({
          id: `v-type-${item.id}`,
          severity: 'HARD',
          title: 'Laboratório Incompatível com a UC',
          detail: `UC "${sub.name}" requer ${ROOM_TYPES.find(r => r.id === sub.reqType)?.name}, mas está alocada em ${rm.name}.`,
          targetType: 'class',
          targetId: item.classId
        });
      }

      const tdKey = `${item.teacherId}@${item.day}`;
      teacherDailyCount[tdKey] = (teacherDailyCount[tdKey] || 0) + 1;
    });

    // Soft constraint: Sobrecarga docente
    Object.entries(teacherDailyCount).forEach(([key, count]) => {
      const [tId, day] = key.split('@');
      const tch = teachers.find(t => t.id === tId);
      if (tch && count > (tch.maxDailySlots || 4)) {
        softScore -= weights.softOverload;
        violations.push({
          id: `v-ov-${key}`,
          severity: 'SOFT',
          title: 'Sobrecarga Diária Docente',
          detail: `${tch.name} possui ${count} blocos na ${day} (recomendado max: ${tch.maxDailySlots}).`,
          targetType: 'teacher',
          targetId: tId
        });
      }
    });

    // Soft constraint: Aulas práticas isoladas
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
              title: 'Aula Prática Descontinuada',
              detail: `Turma ${cls.code} possui apenas 1 bloco isolado da UC prática "${sub.name}" na ${day}.`,
              targetType: 'class',
              targetId: cls.id
            });
          }
        }
      });
    });

    const totalCapacityAllocs = currentSchedule.length;
    const occupationRate = Math.min(100, Math.round((totalCapacityAllocs / Math.max(1, classes.length * 10)) * 100));

    return { hardScore, softScore, violations, conflictingIds, occupationRate };
  }, [currentSchedule, classes, subjects, teachers, rooms, weights]);

  // ==========================================================================
  // MOTOR SOLVER OTIMIZADOR HEURÍSTICO SENAI
  // ==========================================================================
  const runTimefoldAutoSolver = () => {
    if (!canRunSolver) {
      showToast('Apenas a Coordenação Pedagógica pode executar a IA.', 'error');
      return;
    }

    setIsSolving(true);
    setSolverProgress(15);

    setTimeout(() => {
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
        showToast('Todas as UCs da matriz já estão 100% alocadas!', 'info');
        return;
      }

      let candidateSchedule = [...currentSchedule];
      let newlyAddedCount = 0;

      demands.forEach(({ classObj, subjectObj }) => {
        const eligibleTeachers = teachers.filter(t => t.eixos.some(e => subjectObj.eixo.includes(e) || e.includes(subjectObj.eixo)));
        const teacherPool = eligibleTeachers.length > 0 ? eligibleTeachers : teachers;

        const eligibleRooms = rooms.filter(r =>
          (subjectObj.reqType === 'SALA_TEORIA' || r.type === subjectObj.reqType) &&
          r.capacity >= classObj.size
        );
        const roomPool = eligibleRooms.length > 0 ? eligibleRooms : rooms;

        const preferredPeriods = PERIODS.filter(p => p.turn === classObj.shift);
        const otherPeriods = PERIODS.filter(p => p.turn !== classObj.shift);
        const orderedPeriods = [...preferredPeriods, ...otherPeriods];

        let allocated = false;

        for (const day of DAYS) {
          if (allocated) break;
          for (const period of orderedPeriods) {
            if (allocated) break;
            const slotKey = `${day}-${period.id}`;

            if (candidateSchedule.some(a => a.classId === classObj.id && a.day === day && a.periodId === period.id)) {
              continue;
            }

            const freeTeacher = teacherPool.find(t =>
              !t.unavailable?.includes(slotKey) &&
              !candidateSchedule.some(a => a.teacherId === t.id && a.day === day && a.periodId === period.id)
            );

            if (!freeTeacher) continue;

            const freeRoom = roomPool.find(r =>
              !candidateSchedule.some(a => a.roomId === r.id && a.day === day && a.periodId === period.id)
            );

            if (!freeRoom) continue;

            candidateSchedule.push({
              id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              classId: classObj.id,
              subjectId: subjectObj.id,
              teacherId: freeTeacher.id,
              roomId: freeRoom.id,
              day,
              periodId: period.id
            });
            newlyAddedCount++;
            allocated = true;
          }
        }
      });

      setSolverProgress(100);
      setTimeout(() => {
        setIsSolving(false);
        updateCurrentSchedule(candidateSchedule, `Solver IA SENAI alocou ${newlyAddedCount} novos blocos sem conflitos.`);
        showToast(`Otimização IA concluída! ${newlyAddedCount} horários foram alocados.`, 'success');
      }, 500);
    }, 1000);
  };

  // EXPORTAÇÃO CSV
  const exportToCSV = () => {
    const headers = ['Turma', 'Código UC', 'Unidade Curricular', 'Docente / Instrutor SENAI', 'Laboratório / Ambiente', 'Norma NR', 'Dia da Semana', 'Horário'];
    const rows = currentSchedule.map(item => {
      const cls = classes.find(c => c.id === item.classId);
      const sub = subjects.find(s => s.id === item.subjectId);
      const tch = teachers.find(t => t.id === item.teacherId);
      const rm = rooms.find(r => r.id === item.roomId);
      const per = PERIODS.find(p => p.id === item.periodId);
      return [
        `"${cls?.code || ''} - ${cls?.name || ''}"`,
        `"${sub?.code || ''}"`,
        `"${sub?.name || ''}"`,
        `"${tch?.name || ''}"`,
        `"${rm?.name || ''}"`,
        `"${rm?.nr || ''}"`,
        `"${item.day}"`,
        `"${per?.name || ''} (${per?.time || ''})"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Matriz_SENAI_Gestao_Horarios_${selectedDR}_${selectedSemester}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório CSV exportado com sucesso!', 'success');
  };

  // MANIPULAÇÃO DA GRADE DA MATRIZ
  const handleSlotClick = (day, periodId) => {
    if (!canEditSchedule) {
      showToast('Seu perfil atual é apenas para consulta.', 'info');
      return;
    }
    setAllocModal({ open: true, day, periodId });
  };

  const handleManualAllocation = (subjectId, teacherId, roomId) => {
    if (!subjectId || !teacherId || !roomId) {
      showToast('Preencha todos os campos da alocação!', 'error');
      return;
    }
    const { day, periodId } = allocModal;
    const classId = selectedEntityId;

    const filtered = currentSchedule.filter(a => !(a.classId === classId && a.day === day && a.periodId === periodId));
    const newItem = {
      id: `alloc-${Date.now()}`,
      classId,
      subjectId,
      teacherId,
      roomId,
      day,
      periodId
    };

    updateCurrentSchedule([...filtered, newItem], `Alocação manual realizada em ${day} (${periodId}).`);
    setAllocModal({ open: false, day: '', periodId: '' });
    showToast('Horário registrado na matriz!', 'success');
  };

  const handleRemoveAllocation = (allocId) => {
    if (!canEditSchedule) return;
    const filtered = currentSchedule.filter(a => a.id !== allocId);
    updateCurrentSchedule(filtered, 'Alocação removida da matriz.');
    showToast('Alocação removida.', 'info');
  };

  // DRAG & DROP
  const handleDragStart = (e, item) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    setDraggedItemId(item.id);
  };

  const handleDropOnSlot = (e, targetDay, targetPeriodId) => {
    e.preventDefault();
    setDraggedItemId(null);
    if (!canEditSchedule) return;

    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    try {
      const draggedData = JSON.parse(dataStr);

      if (draggedData.type === 'UNALLOCATED_SUBJECT') {
        const sub = subjects.find(s => s.id === draggedData.subjectId);
        const freeTeacher = teachers.find(t => t.eixos.some(e => sub?.eixo.includes(e) || e.includes(sub?.eixo))) || teachers[0];
        const freeRoom = rooms.find(r => r.capacity >= draggedData.size) || rooms[0];

        const newItem = {
          id: `alloc-drag-${Date.now()}`,
          classId: draggedData.classId,
          subjectId: draggedData.subjectId,
          teacherId: freeTeacher.id,
          roomId: freeRoom.id,
          day: targetDay,
          periodId: targetPeriodId
        };
        const filtered = currentSchedule.filter(a => !(a.classId === draggedData.classId && a.day === targetDay && a.periodId === targetPeriodId));
        updateCurrentSchedule([...filtered, newItem], `UC "${sub?.name}" arrastada para ${targetDay} (${targetPeriodId}).`);
        showToast('UC alocada via arraste!', 'success');
      } else if (draggedData.id) {
        const updated = currentSchedule.map(a => {
          if (a.id === draggedData.id) {
            return { ...a, day: targetDay, periodId: targetPeriodId };
          }
          return a;
        });
        updateCurrentSchedule(updated, `Bloco movido para ${targetDay} (${targetPeriodId}).`);
        showToast('Bloco reposicionado!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // SNAPSHOTS
  const handleCreateSnapshot = () => {
    if (!newSnapshotName.trim()) return;
    const newSnap = {
      id: `snap-${Date.now()}`,
      name: newSnapshotName,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      semester: selectedSemester,
      schedule: currentSchedule
    };
    setSnapshots(prev => [newSnap, ...prev]);
    setNewSnapshotName('');
    setSnapshotModalOpen(false);
    addAuditLog(`Snapshot "${newSnap.name}" criado.`);
    showToast('Cenário de matriz gravado com sucesso!', 'success');
  };

  const handleRestoreSnapshot = (snap) => {
    setSchedulesBySemester(prev => ({
      ...prev,
      [snap.semester]: snap.schedule
    }));
    addAuditLog(`Restaurado cenário "${snap.name}".`);
    showToast(`Cenário "${snap.name}" restaurado!`, 'info');
  };

  // TOGGLE DE BLOQUEIO DE DOCENTE
  const toggleTeacherAvailability = (teacherId, slotKey) => {
    if (!canManageEntities) {
      showToast('Apenas administradores podem gerenciar bloqueios de docentes.', 'error');
      return;
    }
    setTeachers(prev => prev.map(t => {
      if (t.id === teacherId) {
        const unavailable = t.unavailable || [];
        const updated = unavailable.includes(slotKey)
          ? unavailable.filter(s => s !== slotKey)
          : [...unavailable, slotKey];
        return { ...t, unavailable: updated };
      }
      return t;
    }));
    showToast('Bloqueio do docente atualizado.', 'info');
  };

  // CRUD HANDLER
  const handleSaveCrudItem = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { type, item } = crudModal;

    if (type === 'teacher') {
      const name = formData.get('name');
      const reg = formData.get('reg');
      const maxDailySlots = parseInt(formData.get('maxDailySlots')) || 4;
      const selectedEixos = formData.getAll('eixos');

      if (item) {
        setTeachers(prev => prev.map(t => t.id === item.id ? { ...t, name, reg, maxDailySlots, eixos: selectedEixos } : t));
        showToast('Docente atualizado!', 'success');
      } else {
        const newTeacher = { id: `T${Date.now()}`, name, reg, maxDailySlots, eixos: selectedEixos, unavailable: [] };
        setTeachers(prev => [...prev, newTeacher]);
        showToast('Novo docente cadastrado!', 'success');
      }
    } else if (type === 'room') {
      const name = formData.get('name');
      const capacity = parseInt(formData.get('capacity')) || 20;
      const roomType = formData.get('type');
      const nr = formData.get('nr');

      if (item) {
        setRooms(prev => prev.map(r => r.id === item.id ? { ...r, name, capacity, type: roomType, nr } : r));
        showToast('Ambiente atualizado!', 'success');
      } else {
        const newRoom = { id: `R${Date.now()}`, name, capacity, type: roomType, nr, unit: selectedUnit };
        setRooms(prev => [...prev, newRoom]);
        showToast('Novo ambiente cadastrado!', 'success');
      }
    } else if (type === 'subject') {
      const code = formData.get('code');
      const name = formData.get('name');
      const hours = parseInt(formData.get('hours')) || 80;
      const weeklySlots = parseInt(formData.get('weeklySlots')) || 2;
      const reqType = formData.get('reqType');
      const modality = formData.get('modality');
      const eixo = formData.get('eixo');
      const isPractical = formData.get('isPractical') === 'on';

      if (item) {
        setSubjects(prev => prev.map(s => s.id === item.id ? { ...s, code, name, hours, weeklySlots, reqType, modality, eixo, isPractical } : s));
        showToast('Unidade Curricular atualizada!', 'success');
      } else {
        const newSub = { id: `S${Date.now()}`, code, name, hours, weeklySlots, reqType, modality, eixo, isPractical };
        setSubjects(prev => [...prev, newSub]);
        showToast('Nova UC cadastrada!', 'success');
      }
    }

    setCrudModal({ open: false, type: '', item: null });
  };

  // ENTIDADES FILTRADAS
  const selectedClass = useMemo(() => classes.find(c => c.id === selectedEntityId) || classes[0], [classes, selectedEntityId]);
  const selectedTeacher = useMemo(() => teachers.find(t => t.id === selectedEntityId) || teachers[0], [teachers, selectedEntityId]);
  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedEntityId) || rooms[0], [rooms, selectedEntityId]);

  const unallocatedSubjects = useMemo(() => {
    if (viewMode !== 'class' || !selectedClass) return [];
    return selectedClass.subjectIds.map(subId => {
      const sub = subjects.find(s => s.id === subId);
      if (!sub) return null;
      const allocatedSlots = currentSchedule.filter(a => a.classId === selectedClass.id && a.subjectId === sub.id).length;
      const remaining = (sub.weeklySlots || 2) - allocatedSlots;
      return { subject: sub, remaining, allocatedSlots };
    }).filter(item => item && item.remaining > 0);
  }, [viewMode, selectedClass, subjects, currentSchedule]);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col font-sans antialiased">

      {/* ==================================================================== */}
      {/* HEADER PRINCIPAL INSTITUCIONAL - AZUL DEEP SENAI (#003366 / #004B8D) */}
      {/* ==================================================================== */}
      <header className="bg-gradient-to-r from-[#003366] via-[#004B8D] to-[#003366] text-white sticky top-0 z-40 shadow-xl border-b-4 border-[#F37021]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Marca SENAI Gestão de Horários */}
          <div className="flex items-center gap-3">
            <div className="bg-white text-[#004B8D] font-extrabold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 border border-slate-200">
              <Building2 className="w-6 h-6 text-[#004B8D]" />
              <div className="flex flex-col">
                <span className="text-xl tracking-wider uppercase font-black leading-none text-[#004B8D]">SENAI</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Sistema FIEC</span>
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight flex items-center gap-2">
                SENAI Gestão de Horários <span className="bg-[#F37021] text-white text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">DR-CE</span>
              </h1>
              <p className="text-xs text-slate-200 mt-0.5 font-medium">Timetable Studio - Gestão Acadêmica & Laboratórios NR</p>
            </div>
          </div>

          {/* Seletores Globais de Contexto SENAI */}
          <div className="flex flex-wrap items-center gap-2 bg-[#00274D]/80 p-1.5 rounded-xl border border-white/10 shadow-inner">
            <div className="flex items-center gap-1.5 px-2 text-slate-200 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#F37021]" />
              <span>DR:</span>
              <select
                value={selectedDR}
                onChange={(e) => {
                  const drCode = e.target.value;
                  setSelectedDR(drCode);
                  const found = REGIONAL_DEPARTMENTS.find(d => d.code === drCode);
                  if (found && found.units.length > 0) {
                    setSelectedUnit(found.units[0]);
                  }
                }}
                className="bg-[#003366] text-white text-xs font-bold rounded-lg px-2 py-1 outline-none border border-white/20 hover:border-white/40 cursor-pointer"
              >
                {REGIONAL_DEPARTMENTS.map(d => (
                  <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-2 text-slate-200 text-xs border-l border-white/10">
              <Building2 className="w-3.5 h-3.5 text-[#0072CE]" />
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-[#003366] text-white text-xs font-bold rounded-lg px-2 py-1 outline-none border border-white/20 max-w-[210px] truncate"
              >
                {(REGIONAL_DEPARTMENTS.find(d => d.code === selectedDR)?.units || []).map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2 text-slate-200 text-xs border-l border-white/10">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-[#003366] text-emerald-300 font-extrabold text-xs rounded-lg px-2 py-1 outline-none border border-white/20 cursor-pointer"
              >
                {SEMESTERS.map(s => (
                  <option key={s} value={s}>Semestre {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Firebase & RBAC */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00274D] border border-white/10 text-xs font-semibold">
              {syncStatus === 'synced' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-emerald-300 hidden sm:inline">Nuvem Sincronizada</span>
                </>
              )}
              {syncStatus === 'saving' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  <span className="text-amber-300">Salvando...</span>
                </>
              )}
              {syncStatus === 'offline' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="text-slate-300">Modo Local (Offline)</span>
                </>
              )}
            </div>

            {/* Selector RBAC */}
            <select
              value={currentRole}
              onChange={(e) => {
                setCurrentRole(e.target.value);
                showToast(`Perfil alterado para ${ROLES.find(r => r.id === e.target.value)?.label}`);
              }}
              className="bg-white text-[#003366] text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 shadow hover:bg-slate-50 cursor-pointer outline-none"
            >
              {ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

        </div>
      </header>

      {/* ==================================================================== */}
      {/* BARRA DE DESEMPENHO E AÇÕES ESTRATÉGICAS (SENAI SCOREBOARD)         */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Placard Timefold Score */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold shadow-sm ${evaluation.hardScore < 0 ? 'bg-red-50 border-red-300 text-red-700' : 'bg-emerald-50 border-emerald-300 text-emerald-800'}`}>
              <ShieldAlert className="w-4 h-4 text-current" />
              <span>Hard Score: {evaluation.hardScore}</span>
            </div>

            <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold shadow-sm ${evaluation.softScore < 0 ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-300 text-slate-700'}`}>
              <Sliders className="w-4 h-4 text-current" />
              <span>Soft Score: {evaluation.softScore}</span>
            </div>

            <div className="px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#0072CE]" />
              <span>Ocupação Matriz: <strong>{evaluation.occupationRate}%</strong></span>
            </div>

            {evaluation.violations.length > 0 && (
              <span className="text-xs text-red-800 bg-red-100 border border-red-300 px-3 py-1 rounded-full flex items-center gap-1 font-bold animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                {evaluation.violations.length} {evaluation.violations.length === 1 ? 'conflito ativo' : 'conflitos ativos'}
              </span>
            )}
          </div>

          {/* Botões Estratégicos & Ações */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Desfazer alteração"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Refazer alteração"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            {/* Botão Solver IA (Laranja Industrial SENAI #F37021) */}
            {canRunSolver && (
              <button
                onClick={runTimefoldAutoSolver}
                disabled={isSolving}
                className="bg-[#F37021] hover:bg-[#d95d13] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50"
              >
                {isSolving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Otimizando ({solverProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Executar Solver IA SENAI</span>
                  </>
                )}
              </button>
            )}

            {/* Cenários */}
            <button
              onClick={() => setSnapshotModalOpen(true)}
              className="bg-[#0072CE] hover:bg-[#005ba3] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cenários ({snapshots.length})</span>
            </button>

            {/* Exportar CSV */}
            <button
              onClick={exportToCSV}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            {canManageEntities && (
              <button
                onClick={handleResetToSenaiDefault}
                className="p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 hover:text-red-700 hover:bg-slate-200 transition"
                title="Restaurar base de dados institucional do SENAI Ceará"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-bounce ${toastMessage.type === 'error' ? 'bg-red-900 text-white border-red-700' : toastMessage.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' : 'bg-slate-900 text-white border-slate-700'}`}>
          {toastMessage.type === 'error' && <ShieldAlert className="w-5 h-5 text-red-400" />}
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
          <span className="text-xs font-bold">{toastMessage.msg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABAS DE NAVEGAÇÃO INSTITUCIONAL SENAI (#004B8D)                      */}
      {/* ==================================================================== */}
      <nav className="bg-[#004B8D] text-white shadow-md">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto px-4">
          {[
            { id: 'grid', label: 'Grade da Matriz', icon: Calendar },
            { id: 'violations', label: 'Diagnóstico & Restrições', icon: ShieldAlert, badge: evaluation.violations.length },
            { id: 'solver', label: 'Motor Solver IA (Timefold)', icon: Sparkles },
            { id: 'crud', label: 'Cadastros & Matrizes', icon: Database },
            { id: 'audit', label: 'Auditoria & Notificações', icon: Bell, badge: notifications.filter(n => n.status === 'Pendente').length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-extrabold uppercase tracking-wider border-b-4 whitespace-nowrap transition ${isActive ? 'border-[#F37021] bg-[#003366] text-white' : 'border-transparent text-slate-200 hover:bg-[#003d75] hover:text-white'}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${tab.id === 'violations' ? 'bg-red-600 text-white' : 'bg-[#F37021] text-white'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ==================================================================== */}
      {/* CONTEÚDO PRINCIPAL DAS ABAS                                          */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* ------------------------------------------------------------------ */}
        {/* ABA 1: GRADE HORÁRIA INTERATIVA (MATRIZ DE AULAS SENAI)           */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'grid' && (
          <div className="space-y-4">
            
            {/* Filtros da Grade */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              
              {/* Modo de Visão */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold uppercase">Visualizar Por:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => { setViewMode('class'); setSelectedEntityId(classes[0]?.id || 'C1'); }}
                    className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'class' ? 'bg-[#004B8D] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Turma SENAI
                  </button>
                  <button
                    onClick={() => { setViewMode('teacher'); setSelectedEntityId(teachers[0]?.id || 'T1'); }}
                    className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'teacher' ? 'bg-[#004B8D] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Docente / Instrutor
                  </button>
                  <button
                    onClick={() => { setViewMode('room'); setSelectedEntityId(rooms[0]?.id || 'R1'); }}
                    className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'room' ? 'bg-[#004B8D] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Laboratório / Oficina NR
                  </button>
                </div>
              </div>

              {/* Seletor Entidade Ativa */}
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full bg-white text-slate-900 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-sm outline-none focus:border-[#0072CE]"
                >
                  {viewMode === 'class' && classes.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name} - Turno: {c.shift}
                    </option>
                  ))}
                  {viewMode === 'teacher' && teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.reg}) - Max: {t.maxDailySlots} blocos/dia
                    </option>
                  ))}
                  {viewMode === 'room' && rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Cap: {r.capacity} postos | {r.nr})
                    </option>
                  ))}
                </select>
              </div>

              {/* Badges de Detalhes da Entidade */}
              {viewMode === 'class' && selectedClass && (
                <div className="flex items-center gap-2 text-xs">
                  {(() => {
                    const mod = MODALIDADES.find(m => m.id === selectedClass.modality);
                    return <span className={`px-2.5 py-1 rounded-md border font-bold ${mod?.badge}`}>{mod?.short}</span>;
                  })()}
                  <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-bold">
                    Lotação: <strong className="text-[#004B8D]">{selectedClass.size} alunos</strong>
                  </span>
                </div>
              )}

              {viewMode === 'room' && selectedRoom && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-1 rounded-md">
                    {selectedRoom.nr}
                  </span>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md font-bold">
                    {selectedRoom.capacity} Postos Livres
                  </span>
                </div>
              )}
            </div>

            {/* Layout Principal da Matriz + Drawer de Pendências */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              
              {/* Tabela de Horários (3/4 da tela) */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#003366] text-white text-xs font-extrabold uppercase tracking-wider">
                        <th className="p-3 w-32 border-r border-[#00274D]">Horário / Turno</th>
                        {DAYS.map(day => (
                          <th key={day} className="p-3 border-r border-[#00274D] text-center">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {PERIODS.map(period => (
                        <tr key={period.id} className="hover:bg-slate-50 transition">
                          {/* Coluna Período */}
                          <td className="p-3 border-r border-slate-200 bg-slate-100/80">
                            <div className="font-extrabold text-xs text-[#004B8D]">{period.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{period.time}</div>
                            <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-bold">{period.turn}</div>
                          </td>

                          {/* Células dos Dias */}
                          {DAYS.map(day => {
                            const slotKey = `${day}-${period.id}`;

                            let itemsInSlot = [];
                            if (viewMode === 'class') {
                              itemsInSlot = currentSchedule.filter(a => a.classId === selectedEntityId && a.day === day && a.periodId === period.id);
                            } else if (viewMode === 'teacher') {
                              itemsInSlot = currentSchedule.filter(a => a.teacherId === selectedEntityId && a.day === day && a.periodId === period.id);
                            } else if (viewMode === 'room') {
                              itemsInSlot = currentSchedule.filter(a => a.roomId === selectedEntityId && a.day === day && a.periodId === period.id);
                            }

                            const isTeacherUnavailable = viewMode === 'teacher' && selectedTeacher?.unavailable?.includes(slotKey);

                            return (
                              <td
                                key={day}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDropOnSlot(e, day, period.id)}
                                onClick={() => viewMode === 'class' && itemsInSlot.length === 0 && handleSlotClick(day, period.id)}
                                className={`p-2 border-r border-slate-200 h-28 vertical-top transition relative group ${isTeacherUnavailable ? 'bg-red-50 border-red-200' : 'hover:bg-sky-50/50 cursor-pointer'}`}
                              >
                                {isTeacherUnavailable && (
                                  <div className="text-[10px] text-red-700 font-extrabold flex flex-col items-center justify-center h-full gap-1">
                                    <Lock className="w-3.5 h-3.5" /> Bloqueado
                                  </div>
                                )}

                                {itemsInSlot.map(alloc => {
                                  const sub = subjects.find(s => s.id === alloc.subjectId);
                                  const tch = teachers.find(t => t.id === alloc.teacherId);
                                  const rm = rooms.find(r => r.id === alloc.roomId);
                                  const cls = classes.find(c => c.id === alloc.classId);
                                  const isConflict = evaluation.conflictingIds.has(alloc.id);
                                  const mod = MODALIDADES.find(m => m.id === (sub?.modality || cls?.modality));

                                  return (
                                    <div
                                      key={alloc.id}
                                      draggable={canEditSchedule}
                                      onDragStart={(e) => handleDragStart(e, alloc)}
                                      className={`p-2 rounded-xl text-xs shadow-md border relative transition group/card ${isConflict ? 'bg-red-100 border-red-500 text-red-900 ring-2 ring-red-400 animate-pulse' : (mod?.card || 'bg-slate-100 border-slate-300 text-slate-900')}`}
                                    >
                                      {/* Header Card */}
                                      <div className="flex items-start justify-between gap-1 mb-1">
                                        <span className="font-extrabold text-[11px] leading-tight line-clamp-1 text-[#003366]">
                                          {sub?.code}: {sub?.name}
                                        </span>
                                        {canEditSchedule && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleRemoveAllocation(alloc.id); }}
                                            className="opacity-0 group-hover/card:opacity-100 text-red-600 hover:text-red-800 p-0.5 rounded transition"
                                            title="Remover alocação"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>

                                      {/* Informações da Alocação */}
                                      <div className="space-y-0.5 text-[10px] text-slate-700 font-medium">
                                        {viewMode !== 'class' && (
                                          <div className="flex items-center gap-1">
                                            <GraduationCap className="w-3 h-3 text-[#0072CE]" />
                                            <span className="font-bold">{cls?.code}</span>
                                          </div>
                                        )}
                                        {viewMode !== 'teacher' && (
                                          <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3 text-[#0072CE]" />
                                            <span className="truncate">{tch?.name || 'Sem Instrutor'}</span>
                                          </div>
                                        )}
                                        {viewMode !== 'room' && (
                                          <div className="flex items-center gap-1">
                                            <DoorOpen className="w-3 h-3 text-[#0072CE]" />
                                            <span className="truncate">{rm?.name || 'Sem Ambiente'}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Badges de NR e Prática */}
                                      {rm?.nr && rm.nr !== 'Padrão Escolar' && (
                                        <div className="mt-1.5 flex items-center justify-between">
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-950 font-black border border-amber-300">
                                            {rm.nr}
                                          </span>
                                          {sub?.isPractical && (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#004B8D] text-white font-bold">
                                              Prática
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {itemsInSlot.length === 0 && !isTeacherUnavailable && (
                                  <div className="h-full flex items-center justify-center text-[11px] text-slate-400 group-hover:text-[#0072CE] font-bold transition">
                                    + Alocar Aula
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

              {/* Gaveta Lateral de UCs Pendentes de Alocação (1/4 da tela) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#F37021]" />
                    <span>UCs a Alocar</span>
                  </h3>
                  <span className="text-xs bg-[#F37021]/10 text-[#F37021] border border-[#F37021]/30 px-2 py-0.5 rounded-full font-black">
                    {unallocatedSubjects.length} pendentes
                  </span>
                </div>

                {viewMode !== 'class' ? (
                  <p className="text-xs text-slate-500 italic">
                    Alterne para a visão por <strong>Turma SENAI</strong> para listar e arrastar as UCs pendentes.
                  </p>
                ) : unallocatedSubjects.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Carga semanal 100% alocada nesta turma!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {unallocatedSubjects.map(({ subject, remaining, allocatedSlots }) => (
                      <div
                        key={subject.id}
                        draggable={canEditSchedule}
                        onDragStart={(e) => handleDragStart(e, {
                          type: 'UNALLOCATED_SUBJECT',
                          subjectId: subject.id,
                          classId: selectedClass.id,
                          size: selectedClass.size
                        })}
                        className="bg-slate-50 border border-slate-300 hover:border-[#0072CE] p-3 rounded-xl shadow-sm cursor-grab active:cursor-grabbing transition space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-black text-[#004B8D]">{subject.code}</span>
                          <span className="text-[10px] bg-[#0072CE] text-white px-2 py-0.5 rounded font-mono font-bold">
                            Faltam: {remaining} blocos
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">{subject.name}</h4>
                        
                        <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200 font-medium">
                          <span>Req: <strong className="text-slate-800">{ROOM_TYPES.find(r => r.id === subject.reqType)?.name}</strong></span>
                          <span>{subject.hours}h tot.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 2: DIAGNÓSTICO COMPLETO DE RESTRIÇÕES INSTITUCIONAIS TIMEFOLD  */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'violations' && (
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-[#003366] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#F37021]" />
                  <span>Diagnóstico Completo de Restrições Pedagógicas & NRs</span>
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Avaliação automatizada em tempo real conforme as normas regulamentadoras do Ministério do Trabalho e diretrizes técnicas do SENAI.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-bold uppercase">Hard Score (Regras Rígidas)</div>
                  <div className={`text-2xl font-black font-mono ${evaluation.hardScore < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {evaluation.hardScore}
                  </div>
                </div>
                <div className="text-right border-l border-slate-200 pl-4">
                  <div className="text-xs text-slate-500 font-bold uppercase">Soft Score (Conforto)</div>
                  <div className="text-2xl font-black font-mono text-amber-700">
                    {evaluation.softScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Relação de Conflitos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
              <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[#003366] uppercase tracking-wider">
                  Detalhamento de Inconformidades ({evaluation.violations.length})
                </h3>
              </div>

              {evaluation.violations.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-extrabold text-slate-800">Matriz 100% Conforme e Sem Violações!</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Todas as turmas, docentes e laboratórios estão alocados respeitando estritamente os postos de trabalho e normas NRs.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {evaluation.violations.map(viol => (
                    <div key={viol.id} className="p-4 hover:bg-slate-50 transition flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {viol.severity === 'HARD' ? (
                          <div className="p-2 bg-red-100 border border-red-300 text-red-700 rounded-xl mt-0.5">
                            <ShieldAlert className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="p-2 bg-amber-100 border border-amber-300 text-amber-800 rounded-xl mt-0.5">
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border uppercase ${viol.severity === 'HARD' ? 'bg-red-600 text-white border-red-700' : 'bg-amber-500 text-white border-amber-600'}`}>
                              {viol.severity}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900">{viol.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 font-medium">{viol.detail}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab('grid');
                          if (viol.targetType === 'class') setViewMode('class');
                          if (viol.targetType === 'teacher') setViewMode('teacher');
                          if (viol.targetType === 'room') setViewMode('room');
                          if (viol.targetId) setSelectedEntityId(viol.targetId);
                        }}
                        className="bg-[#004B8D] hover:bg-[#003366] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition whitespace-nowrap shadow"
                      >
                        Navegar até o Conflito
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 3: MOTOR SOLVER IA (PARAMETRIZAÇÃO & EXECUÇÃO)                 */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'solver' && (
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#003366] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#F37021]" />
                    <span>Motor Otimizador Heurístico IA (Timefold Integration)</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Algoritmo inteligente de alocação de cargas horárias pendentes que cruza a disponibilidade de salas especializadas, limites diários docentes e conformidades de segurança.
                  </p>
                </div>

                {canRunSolver && (
                  <button
                    onClick={runTimefoldAutoSolver}
                    disabled={isSolving}
                    className="bg-[#F37021] hover:bg-[#d95d13] text-white font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isSolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Executar Solver IA Agora</span>
                  </button>
                )}
              </div>

              {isSolving && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2">
                  <div className="flex justify-between text-xs text-slate-800 font-extrabold">
                    <span>Otimizando combinação de matrizes...</span>
                    <span>{solverProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-[#004B8D] via-[#0072CE] to-[#F37021] h-full transition-all duration-300" style={{ width: `${solverProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Configuração de Pesos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
              <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0072CE]" />
                <span>Pesos de Penalização de Restrições</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'hardConflict', label: 'Conflito de Horário Simultâneo', desc: 'Penalidade para choques de professor, sala ou turma' },
                  { key: 'hardCapacity', label: 'Capacidade de Posto NR Excedida', desc: 'Turma com mais alunos do que postos' },
                  { key: 'hardRoomType', label: 'Laboratório Incompatível', desc: 'UC prática em sala teórica' },
                  { key: 'hardUnavailable', label: 'Indisponibilidade Docente', desc: 'Bloqueio de agenda do instrutor' },
                  { key: 'softOverload', label: 'Sobrecarga Diária Docente', desc: 'Docente com blocos além do recomendável' },
                  { key: 'softPracticalSplit', label: 'Aula Prática Fragmentada', desc: 'Bloco único isolado em um dia' }
                ].map(item => (
                  <div key={item.key} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">{item.label}</label>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                    <input
                      type="number"
                      value={weights[item.key]}
                      onChange={(e) => setWeights(prev => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-white text-slate-900 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-300 outline-none focus:border-[#0072CE] mt-2"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 4: CADASTROS COMPLETO (DOCENTES, SALAS NR, UCS, TURMAS)        */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'crud' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Docentes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#F37021]" />
                    <span>Docentes & Instrutores ({teachers.length})</span>
                  </h3>
                  {canManageEntities && (
                    <button
                      onClick={() => setCrudModal({ open: true, type: 'teacher', item: null })}
                      className="bg-[#004B8D] text-white p-1.5 rounded-lg text-xs font-extrabold hover:bg-[#003366] transition flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" /> NOVO
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {teachers.map(t => (
                    <div key={t.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100 transition">
                      <div>
                        <div className="font-extrabold text-slate-900">{t.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{t.reg} • Max: {t.maxDailySlots} blocos/dia</div>
                        <div className="text-[9px] text-[#0072CE] font-bold mt-0.5 line-clamp-1">{t.eixos.join(', ')}</div>
                      </div>
                      {canManageEntities && (
                        <button
                          onClick={() => setCrudModal({ open: true, type: 'teacher', item: t })}
                          className="text-slate-400 hover:text-[#004B8D] p-1 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambientes NR */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-[#0072CE]" />
                    <span>Laboratórios & Oficinas NR ({rooms.length})</span>
                  </h3>
                  {canManageEntities && (
                    <button
                      onClick={() => setCrudModal({ open: true, type: 'room', item: null })}
                      className="bg-[#004B8D] text-white p-1.5 rounded-lg text-xs font-extrabold hover:bg-[#003366] transition flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" /> NOVO
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {rooms.map(r => (
                    <div key={r.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100 transition">
                      <div>
                        <div className="font-extrabold text-slate-900">{r.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Postos: <strong className="text-slate-900">{r.capacity}</strong> • <span className="text-[#F37021] font-bold">{r.nr}</span>
                        </div>
                      </div>
                      {canManageEntities && (
                        <button
                          onClick={() => setCrudModal({ open: true, type: 'room', item: r })}
                          className="text-slate-400 hover:text-[#004B8D] p-1 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* UCs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Unidades Curriculares ({subjects.length})</span>
                  </h3>
                  {canManageEntities && (
                    <button
                      onClick={() => setCrudModal({ open: true, type: 'subject', item: null })}
                      className="bg-[#004B8D] text-white p-1.5 rounded-lg text-xs font-extrabold hover:bg-[#003366] transition flex items-center gap-1 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" /> NOVA
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {subjects.map(s => (
                    <div key={s.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100 transition">
                      <div>
                        <div className="font-extrabold text-slate-900">{s.code} - {s.name}</div>
                        <div className="text-[10px] text-slate-500">{s.hours}h tot. • {s.weeklySlots} blocos/sem</div>
                      </div>
                      {canManageEntities && (
                        <button
                          onClick={() => setCrudModal({ open: true, type: 'subject', item: s })}
                          className="text-slate-400 hover:text-[#004B8D] p-1 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ABA 5: AUDITORIA INSTITUCIONAL & NOTIFICAÇÕES SENAI                */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Solicitações */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#F37021]" />
                  <span>Solicitações de Ajuste Docente</span>
                </h3>
                {currentRole === 'teacher' && (
                  <button
                    onClick={() => setTeacherRequestModal(true)}
                    className="bg-[#F37021] text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow"
                  >
                    + Nova Solicitação
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {notifications.map(not => (
                  <div key={not.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#003366]">{not.from}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{not.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{not.message}</p>
                    {canEditSchedule && not.status === 'Pendente' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setNotifications(prev => prev.map(n => n.id === not.id ? { ...n, status: 'Aprovada' } : n));
                            showToast('Solicitação aprovada!', 'success');
                          }}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] px-3 py-1 rounded-lg"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => {
                            setNotifications(prev => prev.map(n => n.id === not.id ? { ...n, status: 'Rejeitada' } : n));
                            showToast('Solicitação rejeitada.', 'info');
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] px-3 py-1 rounded-lg"
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Trilha de Auditoria */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
              <h3 className="text-sm font-extrabold text-[#003366] flex items-center gap-2 pb-3 border-b border-slate-200">
                <FileText className="w-4 h-4 text-[#0072CE]" />
                <span>Trilha de Auditoria Institucional</span>
              </h3>

              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {auditLogs.map(log => (
                  <div key={log.id} className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-extrabold text-[#004B8D]">{log.role}</span>
                      <span className="font-mono">{log.time}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{log.action}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ==================================================================== */}
      {/* MODAIS DE SISTEMA SENAI                                              */}
      {/* ==================================================================== */}

      {/* MODAL 1: ALOCAÇÃO MANUAL */}
      {allocModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-[#003366]">
                Alocar Aula ({allocModal.day} - {PERIODS.find(p => p.id === allocModal.periodId)?.name})
              </h3>
              <button onClick={() => setAllocModal({ open: false, day: '', periodId: '' })} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.target);
                handleManualAllocation(form.get('subjectId'), form.get('teacherId'), form.get('roomId'));
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Unidade Curricular (UC SENAI)</label>
                <select name="subjectId" required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#0072CE]">
                  <option value="">Selecione a UC...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>[{s.code}] {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Docente / Instrutor Responsável</label>
                <select name="teacherId" required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#0072CE]">
                  <option value="">Selecione o Instrutor...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.reg})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Laboratório ou Oficina NR</label>
                <select name="roomId" required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#0072CE]">
                  <option value="">Selecione o Ambiente...</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity} postos | {r.nr})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAllocModal({ open: false, day: '', periodId: '' })}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F37021] text-white font-extrabold rounded-xl hover:bg-[#d95d13] shadow"
                >
                  Confirmar Alocação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CENÁRIOS / SNAPSHOTS */}
      {snapshotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-[#003366] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0072CE]" />
                <span>Gestão de Cenários & Snapshots</span>
              </h3>
              <button onClick={() => setSnapshotModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do cenário (ex: Proposta B)..."
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  className="flex-1 bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-300 outline-none"
                />
                <button
                  onClick={handleCreateSnapshot}
                  className="bg-[#0072CE] hover:bg-[#005ba3] text-white font-bold px-3.5 py-2 rounded-xl shadow"
                >
                  Salvar
                </button>
              </div>

              <div className="divide-y divide-slate-200 max-h-60 overflow-y-auto">
                {snapshots.map(snap => (
                  <div key={snap.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900">{snap.name}</div>
                      <div className="text-[10px] text-slate-500">Semestre: {snap.semester} • {snap.timestamp}</div>
                    </div>
                    <button
                      onClick={() => handleRestoreSnapshot(snap)}
                      className="bg-slate-100 hover:bg-slate-200 text-[#004B8D] font-extrabold px-3 py-1 rounded-lg border border-slate-300"
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CRUD DE ENTIDADES */}
      {crudModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-[#003366]">
                {crudModal.item ? 'Editar' : 'Novo'} {crudModal.type === 'teacher' ? 'Docente' : crudModal.type === 'room' ? 'Laboratório NR' : 'Unidade Curricular'}
              </h3>
              <button onClick={() => setCrudModal({ open: false, type: '', item: null })} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCrudItem} className="space-y-4 text-xs">
              {crudModal.type === 'teacher' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nome Completo do Docente</label>
                    <input name="name" defaultValue={crudModal.item?.name || ''} required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Matrícula Institucional SENAI</label>
                    <input name="reg" defaultValue={crudModal.item?.reg || ''} required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Carga Máxima Recomendada (Blocos/Dia)</label>
                    <input name="maxDailySlots" type="number" defaultValue={crudModal.item?.maxDailySlots || 4} required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Eixos Tecnológicos Habilitados</label>
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-300 max-h-36 overflow-y-auto">
                      {EIXOS_TECNOLOGICOS.map(e => (
                        <label key={e} className="flex items-center gap-2 text-slate-800 cursor-pointer font-medium">
                          <input type="checkbox" name="eixos" value={e} defaultChecked={crudModal.item?.eixos?.includes(e)} className="rounded text-[#0072CE]" />
                          <span>{e}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Matriz interativa de Bloqueio de Indisponibilidade */}
                  {crudModal.item && (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Grade de Bloqueio de Indisponibilidade:</label>
                      <div className="grid grid-cols-5 gap-1 bg-slate-100 p-2 rounded-xl border border-slate-300">
                        {DAYS.map(day => (
                          <div key={day} className="text-center space-y-1">
                            <span className="font-black text-[10px] text-[#003366] uppercase">{day}</span>
                            {PERIODS.map(p => {
                              const slotKey = `${day}-${p.id}`;
                              const isUn = crudModal.item?.unavailable?.includes(slotKey);
                              return (
                                <button
                                  type="button"
                                  key={p.id}
                                  onClick={() => toggleTeacherAvailability(crudModal.item.id, slotKey)}
                                  className={`w-full py-1 text-[9px] font-bold rounded ${isUn ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-900'}`}
                                >
                                  {p.id}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {crudModal.type === 'room' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nome do Laboratório / Oficina</label>
                    <input name="name" defaultValue={crudModal.item?.name || ''} required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Capacidade de Postos de Trabalho</label>
                    <input name="capacity" type="number" defaultValue={crudModal.item?.capacity || 20} required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tipo de Ambiente Especializado</label>
                    <select name="type" defaultValue={crudModal.item?.type || 'SALA_TEORIA'} className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none">
                      {ROOM_TYPES.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Conformidade com Norma Regulamentadora (NR)</label>
                    <select name="nr" defaultValue={crudModal.item?.nr || 'Padrão Escolar'} className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none">
                      {NR_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {crudModal.type === 'subject' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Código UC</label>
                      <input name="code" defaultValue={crudModal.item?.code || ''} required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Carga Horária Tot.</label>
                      <input name="hours" type="number" defaultValue={crudModal.item?.hours || 80} required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nome da Unidade Curricular</label>
                    <input name="name" defaultValue={crudModal.item?.name || ''} required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Blocos Semanais Necessários</label>
                    <input name="weeklySlots" type="number" defaultValue={crudModal.item?.weeklySlots || 2} required className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ambiente Exigido</label>
                    <select name="reqType" defaultValue={crudModal.item?.reqType || 'SALA_TEORIA'} className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none">
                      {ROOM_TYPES.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCrudModal({ open: false, type: '', item: null })}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F37021] text-white font-extrabold rounded-xl hover:bg-[#d95d13] shadow"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SOLICITAÇÃO DOCENTE */}
      {teacherRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-[#003366]">Solicitação de Ajuste de Agenda SENAI</h3>
              <button onClick={() => setTeacherRequestModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.target);
                const msg = form.get('message');
                setNotifications(prev => [
                  {
                    id: `not-${Date.now()}`,
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    from: 'Docente (Você)',
                    type: 'Solicitação de Ajuste',
                    message: msg,
                    status: 'Pendente'
                  },
                  ...prev
                ]);
                setTeacherRequestModal(false);
                showToast('Solicitação enviada à Coordenação!', 'success');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Descreva o ajuste ou reserva de ambiente pretendida:</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Ex: Solicito alocação prioritária do Lab de CLP às quartas-feiras pela manhã para aula prática..."
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-300 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTeacherRequestModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F37021] text-white font-extrabold rounded-xl hover:bg-[#d95d13] shadow"
                >
                  Enviar à Coordenação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}