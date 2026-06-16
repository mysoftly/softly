import { useState, useMemo, useEffect, useCallback } from 'react'
import './styles.css'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// ── Auth Screen ────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = (p: string) => {
    if (p.length < 8) return null
    const has = (r: RegExp) => r.test(p)
    const score = [has(/[A-Z]/), has(/[a-z]/), has(/[0-9]/), has(/[^A-Za-z0-9]/)].filter(Boolean).length
    if (score <= 1) return { label: 'Слабый', color: '#e74c3c' }
    if (score === 2) return { label: 'Средний', color: '#f39c12' }
    return { label: 'Надёжный', color: '#27ae60' }
  }
  const strength = mode === 'register' ? passwordStrength(password) : null

  const submit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'register' && password.length < 8) {
      setError('Пароль должен быть минимум 8 символов'); setLoading(false); return
    }
    try {
      if (mode === 'register') {
        const { data, error: e } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
        if (e) throw e
        if (data.user && !data.session) {
          setSuccess('Письмо с подтверждением отправлено на почту! Проверьте email.')
        } else if (data.user) {
          onAuth(data.user)
        }
      } else {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password })
        if (e) throw e
        if (data.user) onAuth(data.user)
      }
    } catch (e: any) {
      const msg = e?.message || ''
      if (msg.includes('Invalid login')) setError('Неверный email или пароль')
      else if (msg.includes('already registered')) setError('Этот email уже зарегистрирован')
      else if (msg.includes('Password should')) setError('Пароль должен быть минимум 6 символов')
      else setError(msg || 'Что-то пошло не так')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 300, color: '#6E5F5D', letterSpacing: '0.05em' }}>Softly</h1>
          <p style={{ color: '#9B8B84', fontSize: 13, marginTop: 4 }}>твой личный планер</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 24, padding: 28, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 8px 32px rgba(110,95,93,0.1)' }}>
          <div style={{ display: 'flex', background: 'rgba(235,229,228,0.5)', borderRadius: 12, padding: 3, marginBottom: 24 }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'Jost, sans-serif', transition: 'all 0.2s', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#6E5F5D' : '#9B8B84', boxShadow: mode === m ? '0 1px 4px rgba(110,95,93,0.12)' : 'none' }}>
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Твоё имя"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(155,139,132,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Jost, sans-serif', color: '#6E5F5D', marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
          )}

          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" type="email"
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(155,139,132,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Jost, sans-serif', color: '#6E5F5D', marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />

          <div style={{ position: 'relative', marginBottom: strength ? 6 : 16 }}>
            <input value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Пароль (минимум 8 символов)" type={showPassword ? 'text' : 'password'}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: 12, border: '1px solid rgba(155,139,132,0.3)', background: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Jost, sans-serif', color: '#6E5F5D', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={() => setShowPassword(v => !v)} type="button"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B8B84', padding: 4, display: 'flex', alignItems: 'center' }}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
              )}
            </button>
          </div>
          {strength && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(155,139,132,0.2)' }}>
                <div style={{ height: '100%', borderRadius: 2, background: strength.color, width: strength.label === 'Слабый' ? '33%' : strength.label === 'Средний' ? '66%' : '100%', transition: 'all 0.3s' }} />
              </div>
              <span style={{ fontSize: 11, color: strength.color, minWidth: 60 }}>{strength.label}</span>
            </div>
          )}

          {error && <p style={{ color: '#c0392b', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
          {success && <p style={{ color: '#27ae60', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{success}</p>}

          <button onClick={submit} disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: loading ? 'default' : 'pointer', background: '#9B8B84', color: '#fff', fontSize: 14, fontFamily: 'Jost, sans-serif', fontWeight: 500, opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── localStorage + Supabase hook ───────────────────────────────────────────
function useLS<T>(key: string, init: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : init } catch { return init }
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [syncReady, setSyncReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null))
  }, [])

  const loadFromSupabase = useCallback(async (uid: string) => {
    const { data } = await supabase.from('user_data').select('value').eq('user_id', uid).eq('key', key).single()
    if (data?.value !== undefined && data?.value !== null) setState(data.value as T)
    setSyncReady(true)
  }, [key])

  useEffect(() => {
    if (userId) loadFromSupabase(userId)
    else setSyncReady(true)
  }, [userId, loadFromSupabase])

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)) } catch {}
    console.log('[sync check]', key, 'userId:', userId, 'syncReady:', syncReady)
    if (!userId || !syncReady) return
    supabase.from('user_data')
      .upsert({ user_id: userId, key, value: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' })
      .then(({ error }) => {
        if (error) console.error('[sync error]', key, error.message)
        else console.log('[sync ok]', key)
      })
  }, [key, state, userId, syncReady])

  return [state, setState]
}

// ── Icons ──────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const TasksIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 17h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const GoalsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
  </svg>
)

const WheelIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 2v10M12 12l7-7M12 12l7 7M12 12l-7 7M12 12l-7-7M12 12v10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55"/>
    <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
  </svg>
)


const FinanceIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 6v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M15 9a3 3 0 00-6 0c0 2 6 2 6 4a3 3 0 01-6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const HealthIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const RelationsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const GrowthIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const BooksIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M4 4h16a2 2 0 012 2v13a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 4v13l4-2.5 4 2.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const FilmIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 9h4M2 15h4M18 9h4M18 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 9.5l5 2.5-5 2.5v-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ShoppingIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const TrackerIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 14.5h.01M12 14.5h.01M17 14.5h.01M7 18.5h.01M12 18.5h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

const BirthdayIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M4 11h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="4" y="7" width="16" height="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 7V4M12 7V4M16 7V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="3" r="1" fill="currentColor" opacity="0.75"/>
    <circle cx="12" cy="3" r="1" fill="currentColor" opacity="0.75"/>
    <circle cx="16" cy="3" r="1" fill="currentColor" opacity="0.75"/>
  </svg>
)

const WorkIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 13h20" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 13v2h4v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const StudyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M22 10L12 4 2 10l10 6 10-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12.5v5c0 2.5 2.7 4.5 6 4.5s6-2 6-4.5v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M22 10v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const WishlistIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ChecklistIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Data ───────────────────────────────────────────────────────────────────

interface CardData {
  id: number
  title: string
  desc: string
  icon: JSX.Element
  bg: string
}

const cards: CardData[] = [
  {
    id: 1,
    title: 'Мои задачи',
    desc: 'Список дел на сегодня',
    icon: <TasksIcon />,
    bg: 'linear-gradient(145deg, rgba(235,229,228,0.55), rgba(224,191,182,0.3))',
  },
  {
    id: 2,
    title: 'Цели',
    desc: 'Долгосрочные цели',
    icon: <GoalsIcon />,
    bg: 'linear-gradient(225deg, rgba(224,191,182,0.55), rgba(229,210,209,0.3))',
  },
  {
    id: 3,
    title: 'Колесо баланса',
    desc: 'Баланс жизненных сфер',
    icon: <WheelIcon />,
    bg: 'linear-gradient(145deg, rgba(229,210,209,0.5), rgba(235,229,228,0.35))',
  },
  {
    id: 5,
    title: 'Финансы',
    desc: 'Доходы и расходы',
    icon: <FinanceIcon />,
    bg: 'linear-gradient(145deg, rgba(224,191,182,0.45), rgba(229,210,209,0.25))',
  },
  {
    id: 6,
    title: 'Здоровье',
    desc: 'Самочувствие и спорт',
    icon: <HealthIcon />,
    bg: 'linear-gradient(225deg, rgba(235,229,228,0.55), rgba(155,139,132,0.18))',
  },
  {
    id: 7,
    title: 'Отношения',
    desc: 'Связи и общение',
    icon: <RelationsIcon />,
    bg: 'linear-gradient(145deg, rgba(229,210,209,0.45), rgba(224,191,182,0.28))',
  },
  {
    id: 8,
    title: 'Саморазвитие',
    desc: 'Знания и навыки',
    icon: <GrowthIcon />,
    bg: 'linear-gradient(225deg, rgba(155,139,132,0.2), rgba(235,229,228,0.45))',
  },
  {
    id: 9,
    title: 'Книги',
    desc: 'Прочитанные книги',
    icon: <BooksIcon />,
    bg: 'linear-gradient(145deg, rgba(235,229,228,0.5), rgba(155,139,132,0.22))',
  },
  {
    id: 10,
    title: 'Фильмы',
    desc: 'Просмотренные фильмы',
    icon: <FilmIcon />,
    bg: 'linear-gradient(225deg, rgba(224,191,182,0.5), rgba(229,210,209,0.28))',
  },
  {
    id: 11,
    title: 'Покупки',
    desc: 'Список покупок',
    icon: <ShoppingIcon />,
    bg: 'linear-gradient(145deg, rgba(229,210,209,0.48), rgba(224,191,182,0.3))',
  },
  {
    id: 12,
    title: 'Трекер привычек',
    desc: 'Ежедневный трекер',
    icon: <TrackerIcon />,
    bg: 'linear-gradient(225deg, rgba(155,139,132,0.2), rgba(235,229,228,0.45))',
  },
  {
    id: 13,
    title: 'Дни рождения',
    desc: 'Памятные даты',
    icon: <BirthdayIcon />,
    bg: 'linear-gradient(145deg, rgba(224,191,182,0.48), rgba(229,210,209,0.25))',
  },
  {
    id: 14,
    title: 'Работа',
    desc: 'Рабочие задачи',
    icon: <WorkIcon />,
    bg: 'linear-gradient(225deg, rgba(235,229,228,0.52), rgba(155,139,132,0.18))',
  },
  {
    id: 15,
    title: 'Учёба',
    desc: 'Курсы и обучение',
    icon: <StudyIcon />,
    bg: 'linear-gradient(145deg, rgba(229,210,209,0.45), rgba(224,191,182,0.28))',
  },
  {
    id: 16,
    title: 'Список желаний',
    desc: 'Wishlist',
    icon: <WishlistIcon />,
    bg: 'linear-gradient(225deg, rgba(155,139,132,0.22), rgba(235,229,228,0.42))',
  },
  {
    id: 17,
    title: 'Чек-листы',
    desc: 'По сезонам',
    icon: <ChecklistIcon />,
    bg: 'linear-gradient(135deg, rgba(224,191,182,0.35), rgba(235,229,228,0.4))',
  },
]

// ── Wheel Screen ──────────────────────────────────────────────────────────

const DEFAULT_SPHERES = [
  'Здоровье', 'Финансы', 'Карьера', 'Семья',
  'Отношения', 'Саморазвитие', 'Отдых', 'Духовность',
]
const W_CX = 150, W_CY = 150, W_MAX_R = 95, W_LABEL_R = 116

function wAngle(i: number, n: number) {
  return -Math.PI / 2 + (i * 2 * Math.PI) / n
}

function wPoint(i: number, r: number, n: number) {
  const a = wAngle(i, n)
  return { x: W_CX + r * Math.cos(a), y: W_CY + r * Math.sin(a) }
}

function makePath(radii: number[]) {
  const n = radii.length
  return radii.map((r, i) => {
    const p = wPoint(i, r, n)
    return `${i === 0 ? 'M ' : ' L '}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join('') + ' Z'
}

function WheelScreen(_: { onBack: () => void }) {
  const [spheres, setSpheres] = useLS<string[]>('ls-spheres', [...DEFAULT_SPHERES])
  const [vals, setVals] = useLS<number[]>('ls-vals', new Array(DEFAULT_SPHERES.length).fill(5))
  const [editing, setEditing] = useState(false)
  const [newSphere, setNewSphere] = useState('')

  const n = spheres.length
  const RINGS = [2, 4, 6, 8, 10]

  const setVal = (i: number, v: number) =>
    setVals(prev => { const next = [...prev]; next[i] = v; return next })

  const addSphere = () => {
    const name = newSphere.trim()
    if (!name) return
    setSpheres(prev => [...prev, name])
    setVals(prev => [...prev, 5])
    setNewSphere('')
  }

  const removeSphere = (i: number) => {
    if (spheres.length <= 3) return
    setSpheres(prev => prev.filter((_, idx) => idx !== i))
    setVals(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="wheel-screen">
      <h1 className="wheel-title">Колесо баланса</h1>

      <div className="radar-wrap">
        <svg viewBox="0 0 300 300" className="radar-svg" overflow="visible">
          {RINGS.map(v => (
            <path key={v}
              d={makePath(new Array(n).fill((v / 10) * W_MAX_R))}
              fill="none" stroke="rgba(155,139,132,0.2)" strokeWidth="1"
            />
          ))}

          {spheres.map((_, i) => {
            const p = wPoint(i, W_MAX_R, n)
            return <line key={i} x1={W_CX} y1={W_CY}
              x2={p.x.toFixed(1)} y2={p.y.toFixed(1)}
              stroke="rgba(155,139,132,0.2)" strokeWidth="1"/>
          })}

          <path
            d={makePath(vals.map(v => (v / 10) * W_MAX_R))}
            fill="rgba(224,191,182,0.5)"
            stroke="#9B8B84" strokeWidth="1.5" strokeLinejoin="round"
          />

          {vals.map((v, i) => {
            const p = wPoint(i, (v / 10) * W_MAX_R, n)
            return <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3" fill="#9B8B84"/>
          })}

          {spheres.map((label, i) => {
            const a = wAngle(i, n)
            const p = wPoint(i, W_LABEL_R, n)
            const cosA = Math.cos(a), sinA = Math.sin(a)
            const anchor = cosA > 0.3 ? 'start' : cosA < -0.3 ? 'end' : 'middle'
            const dy = sinA > 0.4 ? 12 : sinA < -0.4 ? -4 : 4
            return (
              <text key={i} x={p.x.toFixed(1)} y={p.y.toFixed(1)} dy={dy}
                textAnchor={anchor} fontSize="8.5" fill="#6E5F5D"
                fontFamily="Jost, sans-serif">
                {label}
              </text>
            )
          })}
        </svg>
      </div>

      {editing ? (
        <div className="wheel-edit-panel">
          <h2 className="wheel-edit-title">Настройка сфер</h2>

          <ul className="wheel-edit-list">
            {spheres.map((s, i) => (
              <li key={i} className="wheel-edit-item">
                <span className="wheel-edit-name">{s}</span>
                <button
                  className="wheel-edit-remove"
                  onClick={() => removeSphere(i)}
                  disabled={spheres.length <= 3}
                  title={spheres.length <= 3 ? 'Минимум 3 сферы' : 'Удалить'}
                >×</button>
              </li>
            ))}
          </ul>

          <div className="wheel-edit-add">
            <input
              className="tasks-input"
              placeholder="Новая сфера..."
              value={newSphere}
              onChange={e => setNewSphere(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSphere() }}
            />
            <button className="tasks-add-btn" onClick={addSphere}>Добавить</button>
          </div>

          <button className="wheel-done-btn" onClick={() => setEditing(false)}>
            Готово
          </button>
        </div>
      ) : (
        <>
          <div className="wheel-sliders">
            {spheres.map((label, i) => {
              const pct = `${((vals[i] - 1) / 9 * 100).toFixed(0)}%`
              return (
                <div key={i} className="wheel-slider-row">
                  <div className="wheel-slider-header">
                    <span className="wheel-slider-label">{label}</span>
                    <span className="wheel-slider-value">{vals[i]}</span>
                  </div>
                  <input
                    type="range" min="1" max="10" value={vals[i]}
                    className="wheel-range"
                    style={{ '--percent': pct } as React.CSSProperties}
                    onChange={e => setVal(i, Number(e.target.value))}
                  />
                </div>
              )
            })}
          </div>

          <button className="wheel-edit-btn" onClick={() => setEditing(true)}>
            Настроить сферы
          </button>
        </>
      )}
    </div>
  )
}

// ── Tasks Screen ──────────────────────────────────────────────────────────

interface Task {
  id: number
  text: string
  icon: string
  done: boolean
}

type TasksData = Record<string, Task[]>

const TASK_EMOJIS = ['💼', '📚', '🏃', '🛒', '❤️', '💰', '🎯', '✨', '📞', '🍽️']

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const days: { date: Date; currentMonth: boolean }[] = []
  for (let i = startDow; i > 0; i--)
    days.push({ date: new Date(year, month, 1 - i), currentMonth: false })
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), currentMonth: true })
  const rem = days.length % 7
  if (rem !== 0)
    for (let i = 1; i <= 7 - rem; i++)
      days.push({ date: new Date(year, month + 1, i), currentMonth: false })
  return days
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function panelDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function TasksScreen(_: { onBack: () => void }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [tasksData, setTasksData] = useLS<TasksData>('ls-tasks-data', {})
  const [newText, setNewText] = useState('')
  const [newIcon, setNewIcon] = useState('✨')

  const todayKey = toDateKey(now)

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

  const prevMonth = () => {
    setSelectedDate(null)
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    setSelectedDate(null)
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const addTask = (dateKey: string) => {
    const text = newText.trim()
    if (!text) return
    setTasksData(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), { id: Date.now(), text, icon: newIcon, done: false }],
    }))
    setNewText('')
  }

  const toggleTask = (dateKey: string, id: number) => {
    setTasksData(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map(t => t.id === id ? { ...t, done: !t.done } : t),
    }))
  }

  const deleteTask = (dateKey: string, id: number) => {
    setTasksData(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(t => t.id !== id),
    }))
  }

  const rawMonthLabel = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  const monthLabel = rawMonthLabel.charAt(0).toUpperCase() + rawMonthLabel.slice(1)

  return (
    <div className="tasks-screen">

      <div className="calendar">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>←</button>
          <span className="cal-month-label">{monthLabel}</span>
          <button className="cal-nav-btn" onClick={nextMonth}>→</button>
        </div>

        <div className="cal-weekdays">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
            <span key={d} className="cal-weekday">{d}</span>
          ))}
        </div>

        <div className="cal-grid">
          {calendarDays.map(({ date, currentMonth }) => {
            const key = toDateKey(date)
            const isToday = key === todayKey
            const isSelected = key === selectedDate
            const hasTasks = (tasksData[key]?.length ?? 0) > 0
            return (
              <button
                key={key}
                className={[
                  'cal-day',
                  !currentMonth ? 'cal-day--other' : '',
                  isToday ? 'cal-day--today' : '',
                  isSelected ? 'cal-day--selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedDate(prev => prev === key ? null : key)}
              >
                <span>{date.getDate()}</span>
                {hasTasks && <span className="cal-dot" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`tasks-panel${selectedDate !== null ? ' tasks-panel--visible' : ''}`}>
        <div className="tasks-panel-handle" />
        {selectedDate !== null && (
          <>
            <h2 className="tasks-panel-title">Задачи на {panelDateLabel(selectedDate)}</h2>

            {(tasksData[selectedDate]?.length ?? 0) === 0 && (
              <p className="tasks-empty">Задач нет — добавь первую ✨</p>
            )}

            <ul className="tasks-list">
              {(tasksData[selectedDate] || []).map(task => (
                <li key={task.id} className={`task-item${task.done ? ' task-item--done' : ''}`}>
                  <button className="task-checkbox" onClick={() => toggleTask(selectedDate, task.id)}>
                    {task.done && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <span className="task-icon">{task.icon}</span>
                  <span className="task-text">{task.text}</span>
                  <button className="task-delete" onClick={() => deleteTask(selectedDate, task.id)}>×</button>
                </li>
              ))}
            </ul>

            <div className="tasks-add-section">
              <div className="tasks-emoji-row">
                {TASK_EMOJIS.map(e => (
                  <button
                    key={e}
                    className={`emoji-btn${newIcon === e ? ' emoji-btn--active' : ''}`}
                    onClick={() => setNewIcon(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="tasks-input-row">
                <input
                  className="tasks-input"
                  type="text"
                  placeholder="Новая задача..."
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTask(selectedDate) }}
                />
                <button className="tasks-add-btn" onClick={() => addTask(selectedDate)}>
                  Добавить
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Shopping Screen ───────────────────────────────────────────────────────

interface ShoppingItem {
  id: number
  text: string
  done: boolean
}

function ShoppingScreen() {
  const [items, setItems] = useLS<ShoppingItem[]>('ls-shopping', [])
  const [input, setInput] = useState('')

  const addItem = () => {
    const text = input.trim()
    if (!text) return
    setItems(prev => [{ id: Date.now(), text, done: false }, ...prev])
    setInput('')
  }

  const toggleItem = (id: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    ))
  }

  const deleteItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const sorted = [
    ...items.filter(i => !i.done),
    ...items.filter(i => i.done),
  ]

  return (
    <div className="shopping-screen">
      <h1 className="shopping-title">Покупки</h1>

      <div className="shopping-input-wrap">
        <input
          className="shopping-input"
          type="text"
          placeholder="Добавить товар..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addItem() }}
        />
        <button className="shopping-add-btn" onClick={addItem}>
          Добавить
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="shopping-empty">Список пуст ✨</p>
      ) : (
        <ul className="shopping-list">
          {sorted.map(item => (
            <li key={item.id} className={`shopping-item${item.done ? ' shopping-item--done' : ''}`}>
              <button className="shopping-checkbox" onClick={() => toggleItem(item.id)}>
                {item.done && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className="shopping-text">{item.text}</span>
              <button className="shopping-delete" onClick={() => deleteItem(item.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Books Screen ──────────────────────────────────────────────────────────

interface Book {
  id: number
  title: string
  author: string
  rating: number
  date: string
}

const BOOK_GRADS = [
  'linear-gradient(145deg, rgba(235,229,228,0.55), rgba(224,191,182,0.3))',
  'linear-gradient(225deg, rgba(224,191,182,0.5), rgba(229,210,209,0.28))',
  'linear-gradient(145deg, rgba(229,210,209,0.48), rgba(235,229,228,0.3))',
  'linear-gradient(225deg, rgba(155,139,132,0.18), rgba(224,191,182,0.3))',
]

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          className={`star${s <= rating ? ' star--filled' : ''}`}
          onClick={() => onChange?.(s)}
          style={{ cursor: onChange ? 'pointer' : 'default' }}
        >★</button>
      ))}
    </div>
  )
}

function BooksScreen(_: { onBack: () => void }) {
  const [books, setBooks] = useLS<Book[]>('ls-books', [])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formAuthor, setFormAuthor] = useState('')
  const [formRating, setFormRating] = useState(5)
  const [booksSearch, setBooksSearch] = useState('')

  const openAdd = () => {
    setEditingId(null)
    setFormTitle('')
    setFormAuthor('')
    setFormRating(5)
    setShowForm(true)
  }

  const openEdit = (book: Book) => {
    setEditingId(book.id)
    setFormTitle(book.title)
    setFormAuthor(book.author)
    setFormRating(book.rating)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormTitle('')
    setFormAuthor('')
    setFormRating(5)
  }

  const saveBook = () => {
    if (!formTitle.trim()) return
    if (editingId !== null) {
      setBooks(prev => prev.map(b =>
        b.id === editingId
          ? { ...b, title: formTitle.trim(), author: formAuthor.trim(), rating: formRating }
          : b
      ))
    } else {
      const book: Book = {
        id: Date.now(),
        title: formTitle.trim(),
        author: formAuthor.trim(),
        rating: formRating,
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
      }
      setBooks(prev => [book, ...prev])
    }
    closeForm()
  }

  const deleteBook = (id: number) =>
    setBooks(prev => prev.filter(b => b.id !== id))

  const q = booksSearch.toLowerCase()
  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
  )

  return (
    <div className="books-screen">

      <div className="books-header">
        <h1 className="books-title">Книги</h1>
        <p className="books-count">Прочитано книг: {books.length}</p>
      </div>

      {books.length > 0 && (
        <input
          className="books-search"
          type="text"
          placeholder="Поиск по названию или автору..."
          value={booksSearch}
          onChange={e => setBooksSearch(e.target.value)}
        />
      )}

      {books.length === 0 && !showForm && (
        <p className="books-empty">
          Твоя библиотека пуста ✨<br />Добавь первую книгу
        </p>
      )}

      {books.length > 0 && filtered.length === 0 && (
        <p className="books-empty">Ничего не найдено</p>
      )}

      <div className="books-list">
        {filtered.map((book, idx) => (
          <div
            key={book.id}
            className="book-card"
            style={{ background: BOOK_GRADS[idx % BOOK_GRADS.length] }}
          >
            <div className="book-card-top">
              <div className="book-card-info">
                <h3 className="book-card-title">{book.title}</h3>
                {book.author && <p className="book-card-author">{book.author}</p>}
              </div>
              <div className="book-card-actions">
                <button className="book-edit" onClick={() => openEdit(book)}>✏️</button>
                <button className="book-delete" onClick={() => deleteBook(book.id)}>×</button>
              </div>
            </div>
            <div className="book-card-bottom">
              <StarRating rating={book.rating} />
              <span className="book-date">{book.date}</span>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="books-form">
          <h2 className="books-form-title">
            {editingId !== null ? 'Редактировать книгу' : 'Новая книга'}
          </h2>

          <input
            className="books-field"
            placeholder="Название *"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveBook() }}
          />
          <input
            className="books-field"
            placeholder="Автор"
            value={formAuthor}
            onChange={e => setFormAuthor(e.target.value)}
          />

          <div className="books-form-stars">
            <span className="books-form-label">Оценка</span>
            <StarRating rating={formRating} onChange={setFormRating} />
          </div>

          <div className="books-form-actions">
            <button className="books-cancel-btn" onClick={closeForm}>Отмена</button>
            <button
              className="books-save-btn"
              onClick={saveBook}
              disabled={!formTitle.trim()}
            >Сохранить</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="books-fab" onClick={openAdd}>+</button>
      )}
    </div>
  )
}

// ── Films Screen ──────────────────────────────────────────────────────────

type FilmType = 'film' | 'series'

interface Film {
  id: number
  type: FilmType
  title: string
  genres: string[]
  rating: number
  seasons?: number
  episodes?: number
  date: string
}

const FILM_GENRES = ['Драма','Комедия','Триллер','Ужасы','Фантастика','Романтика','Документальный','Анимация','Другое']

const FILM_GRADS = [
  'linear-gradient(145deg, rgba(110,95,93,0.12), rgba(224,191,182,0.32))',
  'linear-gradient(225deg, rgba(229,210,209,0.5), rgba(235,229,228,0.28))',
  'linear-gradient(145deg, rgba(224,191,182,0.45), rgba(229,210,209,0.25))',
  'linear-gradient(225deg, rgba(235,229,228,0.52), rgba(155,139,132,0.15))',
]

function pluralRu(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10, mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return `${n} ${many}`
  if (mod10 === 1) return `${n} ${one}`
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`
  return `${n} ${many}`
}

function FilmsScreen(_: { onBack: () => void }) {
  const [films, setFilms] = useLS<Film[]>('ls-films', [])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formType, setFormType] = useState<FilmType>('film')
  const [formTitle, setFormTitle] = useState('')
  const [formGenres, setFormGenres] = useState<string[]>([])
  const [formRating, setFormRating] = useState(5)
  const [formSeasons, setFormSeasons] = useState('')
  const [formEpisodes, setFormEpisodes] = useState('')
  const [filmsSearch, setFilmsSearch] = useState('')

  const toggleGenre = (g: string) =>
    setFormGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const resetForm = () => {
    setFormType('film')
    setFormTitle('')

    setFormGenres([])
    setFormRating(5)
    setFormSeasons('')
    setFormEpisodes('')
  }

  const openAdd = () => { setEditingId(null); resetForm(); setShowForm(true) }

  const openEdit = (film: Film) => {
    setEditingId(film.id)
    setFormType(film.type)
    setFormTitle(film.title)

    setFormGenres([...film.genres])
    setFormRating(film.rating)
    setFormSeasons(film.seasons != null ? String(film.seasons) : '')
    setFormEpisodes(film.episodes != null ? String(film.episodes) : '')
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); resetForm() }

  const saveFilm = () => {
    if (!formTitle.trim()) return
    const base = {
      title: formTitle.trim(),

      genres: formGenres,
      rating: formRating,
      type: formType,
      seasons: formType === 'series' && formSeasons ? parseInt(formSeasons) : undefined,
      episodes: formType === 'series' && formEpisodes ? parseInt(formEpisodes) : undefined,
    }
    if (editingId !== null) {
      setFilms(prev => prev.map(f => f.id === editingId ? { ...f, ...base } : f))
    } else {
      setFilms(prev => [{
        id: Date.now(),
        ...base,
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
      }, ...prev])
    }
    closeForm()
  }

  const deleteFilm = (id: number) => setFilms(prev => prev.filter(f => f.id !== id))

  const filmCount = films.filter(f => f.type === 'film').length
  const seriesCount = films.filter(f => f.type === 'series').length

  const q = filmsSearch.toLowerCase()
  const filtered = films.filter(f =>
    f.title.toLowerCase().includes(q)
  )

  const formLabel = editingId !== null
    ? (formType === 'film' ? 'Редактировать фильм' : 'Редактировать сериал')
    : (formType === 'film' ? 'Новый фильм' : 'Новый сериал')

  return (
    <div className="books-screen">

      <div className="books-header">
        <h1 className="books-title">Фильмы и сериалы</h1>
        <p className="books-count">
          {filmCount > 0 && `Фильмов: ${filmCount}`}
          {filmCount > 0 && seriesCount > 0 && ' · '}
          {seriesCount > 0 && `Сериалов: ${seriesCount}`}
          {films.length === 0 && 'Ничего не добавлено'}
        </p>
      </div>

      {films.length > 0 && (
        <input
          className="books-search"
          type="text"
          placeholder="Поиск по названию..."
          value={filmsSearch}
          onChange={e => setFilmsSearch(e.target.value)}
        />
      )}

      {films.length === 0 && !showForm && (
        <p className="books-empty">Твой кинозал пуст ✨</p>
      )}

      {films.length > 0 && filtered.length === 0 && (
        <p className="books-empty">Ничего не найдено</p>
      )}

      <div className="books-list">
        {filtered.map((film, idx) => (
          <div
            key={film.id}
            className="book-card"
            style={{ background: FILM_GRADS[idx % FILM_GRADS.length] }}
          >
            <div className="book-card-top">
              <div className="book-card-info">
                <h3 className="book-card-title">{film.title}</h3>

              </div>
              <div className="book-card-actions">
                <button className="book-edit" onClick={() => openEdit(film)}>✏️</button>
                <button className="book-delete" onClick={() => deleteFilm(film.id)}>×</button>
              </div>
            </div>
            {film.genres.length > 0 && (
              <div className="film-card-genres">
                {film.genres.map(g => (
                  <span key={g} className="film-genre-tag">{g}</span>
                ))}
              </div>
            )}
            <div className="film-card-footer">
              <StarRating rating={film.rating} />
              <div className="film-card-right">
                {film.type === 'series' && (film.seasons != null || film.episodes != null) && (
                  <span className="film-series-info">
                    📺{film.seasons != null ? ` ${pluralRu(film.seasons,'сезон','сезона','сезонов')}` : ''}
                    {film.seasons != null && film.episodes != null ? ' · ' : ''}
                    {film.episodes != null ? pluralRu(film.episodes,'серия','серии','серий') : ''}
                  </span>
                )}
                <span className="book-date">{film.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="books-form">
          <h2 className="books-form-title">{formLabel}</h2>

          <div className="film-type-switch">
            <button
              type="button"
              className={`film-type-btn${formType === 'film' ? ' film-type-btn--active' : ''}`}
              onClick={() => setFormType('film')}
            >Фильм</button>
            <button
              type="button"
              className={`film-type-btn${formType === 'series' ? ' film-type-btn--active' : ''}`}
              onClick={() => setFormType('series')}
            >Сериал</button>
          </div>

          <input
            className="books-field"
            placeholder="Название *"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveFilm() }}
          />
          {formType === 'series' && (
            <div className="film-series-fields">
              <input
                className="books-field"
                type="number"
                min="1"
                placeholder="Сезонов"
                value={formSeasons}
                onChange={e => setFormSeasons(e.target.value)}
              />
              <input
                className="books-field"
                type="number"
                min="1"
                placeholder="Серий"
                value={formEpisodes}
                onChange={e => setFormEpisodes(e.target.value)}
              />
            </div>
          )}

          <div>
            <p className="books-form-label" style={{ marginBottom: 8 }}>Жанры</p>
            <div className="film-genres">
              {FILM_GENRES.map(g => (
                <button
                  key={g}
                  type="button"
                  className={`film-genre-btn${formGenres.includes(g) ? ' film-genre-btn--active' : ''}`}
                  onClick={() => toggleGenre(g)}
                >{g}</button>
              ))}
            </div>
          </div>

          <div className="books-form-stars">
            <span className="books-form-label">Оценка</span>
            <StarRating rating={formRating} onChange={setFormRating} />
          </div>

          <div className="books-form-actions">
            <button className="books-cancel-btn" onClick={closeForm}>Отмена</button>
            <button
              className="books-save-btn"
              onClick={saveFilm}
              disabled={!formTitle.trim()}
            >Сохранить</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="books-fab" onClick={openAdd}>+</button>
      )}
    </div>
  )
}

// ── Tracker Screen ────────────────────────────────────────────────────────

interface Habit {
  id: number
  name: string
  emoji: string
}

type HabitLog = Record<number, Record<string, boolean>> // habitId → date → done

const HABIT_EMOJIS = ['🏃','💧','📚','🧘','😴','🥗','💊','🚫','✍️','🎯']

const WEEK_DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getMondayOf(d: Date) {
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1
  const mon = new Date(d)
  mon.setDate(d.getDate() - day)
  return mon
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function calcStreak(habitId: number, log: HabitLog): number {
  const today = new Date()
  let streak = 0
  const d = new Date(today)
  while (true) {
    if (log[habitId]?.[dateKey(d)]) {
      streak++
      d.setDate(d.getDate() - 1)
    } else break
  }
  return streak
}

function ruMonth(month: number, year: number) {
  const s = new Date(year, month, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type TrackerView = 'week' | 'month'

function TrackerScreen(_: { onBack: () => void }) {
  const today = new Date()
  const [habits, setHabits] = useLS<Habit[]>('ls-habits', [])
  const [log, setLog] = useLS<HabitLog>('ls-habit-log', {})
  const [viewMode, setViewMode] = useState<TrackerView>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmoji, setFormEmoji] = useState(HABIT_EMOJIS[0])

  // ── week data
  const monday = useMemo(() => {
    const m = getMondayOf(today)
    m.setDate(m.getDate() + weekOffset * 7)
    return m
  }, [weekOffset])
  const weekDates = useMemo(() => getWeekDates(monday), [monday])

  // ── month data
  const { monthYear, monthDates, monthPad } = useMemo(() => {
    const ref = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
    const y = ref.getFullYear(), m = ref.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const firstDow = new Date(y, m, 1).getDay()
    const pad = firstDow === 0 ? 6 : firstDow - 1
    return {
      monthYear: { y, m },
      monthDates: Array.from({ length: daysInMonth }, (_, i) => new Date(y, m, i + 1)),
      monthPad: pad,
    }
  }, [monthOffset])

  const periodLabel = useMemo(() => {
    if (viewMode === 'month') return ruMonth(monthYear.m, monthYear.y)
    const months = new Set(weekDates.map(d => `${d.getMonth()}-${d.getFullYear()}`))
    if (months.size === 1) return ruMonth(weekDates[0].getMonth(), weekDates[0].getFullYear())
    const mA = weekDates[0].toLocaleDateString('ru-RU', { month: 'long' })
    const mB = weekDates[6].toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    return `${mA} — ${mB}`
  }, [viewMode, weekDates, monthYear])

  const navPrev = () => viewMode === 'week' ? setWeekOffset(w => w - 1) : setMonthOffset(m => m - 1)
  const navNext = () => viewMode === 'week' ? setWeekOffset(w => w + 1) : setMonthOffset(m => m + 1)
  const navNextDisabled = viewMode === 'week' ? weekOffset >= 0 : monthOffset >= 0

  const toggleDay = (habitId: number, key: string) => {
    setLog(prev => ({
      ...prev,
      [habitId]: { ...prev[habitId], [key]: !prev[habitId]?.[key] },
    }))
  }

  const addHabit = () => {
    if (!formName.trim()) return
    setHabits(prev => [...prev, { id: Date.now(), name: formName.trim(), emoji: formEmoji }])
    setFormName('')
    setFormEmoji(HABIT_EMOJIS[0])
    setShowForm(false)
  }

  const deleteHabit = (id: number) => {
    setHabits(prev => prev.filter(h => h.id !== id))
    setLog(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  const todayKey = dateKey(today)

  return (
    <div className="tracker-screen">

      <div className="books-header">
        <h1 className="books-title">Трекер привычек</h1>
      </div>

      {/* view switcher */}
      <div className="tracker-view-switch">
        <button
          className={`tracker-view-btn${viewMode === 'week' ? ' tracker-view-btn--active' : ''}`}
          onClick={() => setViewMode('week')}
        >Неделя</button>
        <button
          className={`tracker-view-btn${viewMode === 'month' ? ' tracker-view-btn--active' : ''}`}
          onClick={() => setViewMode('month')}
        >Месяц</button>
      </div>

      {/* nav + period */}
      <div className="tracker-header">
        <button className="tracker-nav" onClick={navPrev}>←</button>
        <span className="tracker-month">{periodLabel}</span>
        <button className="tracker-nav" onClick={navNext} disabled={navNextDisabled}>→</button>
      </div>

      {/* week day column headers */}
      {viewMode === 'week' && (
        <div className="tracker-week-header">
          {weekDates.map((d, i) => (
            <div
              key={i}
              className={`tracker-day-label${dateKey(d) === todayKey ? ' tracker-day-label--today' : ''}`}
            >
              <span className="tracker-day-name">{WEEK_DAYS[i]}</span>
              <span className="tracker-day-num">{d.getDate()}</span>
            </div>
          ))}
        </div>
      )}

      {habits.length === 0 && !showForm && (
        <p className="books-empty">Добавь первую привычку ✨</p>
      )}

      <div className="tracker-list">
        {habits.map(habit => {
          const streak = calcStreak(habit.id, log)
          return (
            <div key={habit.id} className="tracker-habit-card">
              {/* habit header line */}
              <div className="tracker-habit-info">
                <span className="tracker-habit-emoji">{habit.emoji}</span>
                <span className="tracker-habit-name">{habit.name}</span>
                {streak > 0 && <span className="tracker-streak">🔥{streak}</span>}
                <button className="tracker-delete" onClick={() => deleteHabit(habit.id)}>×</button>
              </div>

              {/* week view: one row of 7 circles */}
              {viewMode === 'week' && (
                <div className="tracker-days">
                  {weekDates.map((d, i) => {
                    const key = dateKey(d)
                    const done = !!log[habit.id]?.[key]
                    const isFuture = d > today
                    return (
                      <button
                        key={i}
                        className={`tracker-circle${done ? ' tracker-circle--done' : ''}${isFuture ? ' tracker-circle--future' : ''}`}
                        onClick={() => !isFuture && toggleDay(habit.id, key)}
                        disabled={isFuture}
                      />
                    )
                  })}
                </div>
              )}

              {/* month view: mini calendar grid */}
              {viewMode === 'month' && (
                <div className="tracker-month-grid">
                  {/* weekday headers */}
                  {WEEK_DAYS.map(wd => (
                    <span key={wd} className="tracker-month-wd">{wd}</span>
                  ))}
                  {/* empty padding cells */}
                  {Array.from({ length: monthPad }, (_, i) => (
                    <span key={`pad-${i}`} />
                  ))}
                  {/* day circles */}
                  {monthDates.map((d, i) => {
                    const key = dateKey(d)
                    const done = !!log[habit.id]?.[key]
                    const isFuture = d > today
                    return (
                      <button
                        key={i}
                        className={`tracker-circle tracker-circle--sm${done ? ' tracker-circle--done' : ''}${isFuture ? ' tracker-circle--future' : ''}${key === todayKey ? ' tracker-circle--today' : ''}`}
                        title={`${d.getDate()}`}
                        onClick={() => !isFuture && toggleDay(habit.id, key)}
                        disabled={isFuture}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="tracker-form">
          <div className="tracker-emoji-grid">
            {HABIT_EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                className={`tracker-emoji-btn${formEmoji === e ? ' tracker-emoji-btn--active' : ''}`}
                onClick={() => setFormEmoji(e)}
              >{e}</button>
            ))}
          </div>
          <div className="tracker-form-row">
            <input
              className="books-field"
              placeholder="Название привычки"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addHabit() }}
              autoFocus
            />
            <button
              className="tracker-add-confirm"
              onClick={addHabit}
              disabled={!formName.trim()}
            >+</button>
          </div>
          <button className="books-cancel-btn" onClick={() => { setShowForm(false); setFormName('') }}>
            Отмена
          </button>
        </div>
      )}

      {!showForm && (
        <button className="books-fab" onClick={() => setShowForm(true)}>+</button>
      )}
    </div>
  )
}

// ── Goals Screen ──────────────────────────────────────────────────────────

type GoalTab = 'day' | 'week' | 'month'

interface GoalStep {
  id: number
  text: string
  mins: number | null
  done: boolean
}

interface Goal {
  id: number
  title: string
  tab: GoalTab
  steps: GoalStep[]
  checked: boolean
}

const GOAL_MINS_PRESETS = [5, 10, 15, 30]

function CircleProgress({ done, total }: { done: number; total: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const pct = total === 0 ? 0 : done / total
  const offset = circ * (1 - pct)
  return (
    <svg width="48" height="48" viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(110,95,93,0.12)" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r}
        fill="none"
        stroke={pct === 1 ? '#9B8B84' : '#C4AFA8'}
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.35s ease' }}
      />
      <text x="26" y="30" textAnchor="middle" fontSize="11" fontFamily="Jost,sans-serif" fill="#6E5F5D">
        {done}/{total}
      </text>
    </svg>
  )
}

interface GoalFormStep { text: string; mins: number | null; customMins: string }

function GoalsScreen(_: { onBack: () => void }) {
  const [tab, setTab] = useState<GoalTab>('day')
  const [goals, setGoals] = useLS<Goal[]>('ls-goals', [])
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // form state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formSteps, setFormSteps] = useState<GoalFormStep[]>([])

  const TAB_LABELS: Record<GoalTab, string> = { day: 'День', week: 'Неделя', month: 'Месяц' }
  const tabGoals = goals.filter(g => g.tab === tab)

  // ── helpers
  const toggleExpand = (id: number) =>
    setExpandedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const toggleStep = (goalId: number, stepId: number) =>
    setGoals(prev => prev.map(g => g.id !== goalId ? g : {
      ...g,
      steps: g.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s),
    }))

  const toggleChecked = (goalId: number) =>
    setGoals(prev => prev.map(g => g.id !== goalId ? g : { ...g, checked: !g.checked }))

  const deleteGoal = (id: number) =>
    setGoals(prev => prev.filter(g => g.id !== id))

  // ── form helpers
  const blankStep = (): GoalFormStep => ({ text: '', mins: null, customMins: '' })

  const openAdd = () => {
    setEditingId(null)
    setFormTitle('')
    setFormSteps([])
    setShowForm(true)
  }

  const openEdit = (goal: Goal) => {
    setEditingId(goal.id)
    setFormTitle(goal.title)
    setFormSteps(goal.steps.map(s => ({
      text: s.text,
      mins: s.mins,
      customMins: s.mins != null && !GOAL_MINS_PRESETS.includes(s.mins) ? String(s.mins) : '',
    })))
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); setFormTitle(''); setFormSteps([]) }

  const updateFormStep = (i: number, patch: Partial<GoalFormStep>) =>
    setFormSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))

  const removeFormStep = (i: number) =>
    setFormSteps(prev => prev.filter((_, idx) => idx !== i))

  const resolvedMins = (fs: GoalFormStep): number | null => {
    if (fs.customMins.trim()) {
      const n = parseInt(fs.customMins)
      return isNaN(n) || n <= 0 ? null : n
    }
    return fs.mins
  }

  const saveGoal = () => {
    if (!formTitle.trim()) return
    const steps: GoalStep[] = formSteps
      .filter(s => s.text.trim())
      .map((s, i) => ({ id: i + 1, text: s.text.trim(), mins: resolvedMins(s), done: false }))

    if (editingId !== null) {
      setGoals(prev => prev.map(g => g.id !== editingId ? g : {
        ...g,
        title: formTitle.trim(),
        steps: steps.map(ns => {
          const old = g.steps.find(os => os.text === ns.text)
          return old ? { ...ns, done: old.done } : ns
        }),
      }))
    } else {
      setGoals(prev => [{ id: Date.now(), title: formTitle.trim(), tab, steps, checked: false }, ...prev])
    }
    closeForm()
  }

  return (
    <div className="books-screen">

      <div className="books-header">
        <h1 className="books-title">Цели</h1>
      </div>

      <div className="goals-tabs">
        {(['day', 'week', 'month'] as GoalTab[]).map(t => (
          <button key={t} className={`goals-tab${tab === t ? ' goals-tab--active' : ''}`} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tabGoals.length === 0 && !showForm && (
        <p className="books-empty">Нет целей на этот период ✨</p>
      )}

      <div className="goals-list">
        {tabGoals.map(goal => {
          const doneCnt = goal.steps.filter(s => s.done).length
          const totalCnt = goal.steps.length
          const stepsAllDone = totalCnt > 0 && doneCnt === totalCnt
          const achieved = goal.checked || stepsAllDone
          const isOpen = expandedIds.has(goal.id)

          return (
            <div key={goal.id} className={`goal-card${achieved ? ' goal-card--done' : ''}`}>
              <div className="goal-card-top">
                {/* direct checkbox */}
                <label className="goal-check-wrap" title="Отметить выполненной">
                  <input
                    type="checkbox"
                    className="goal-step-check"
                    checked={goal.checked || stepsAllDone}
                    onChange={() => toggleChecked(goal.id)}
                  />
                </label>

                <div className="goal-card-center">
                  <h3 className={`goal-title${achieved ? ' goal-title--done' : ''}`}>{goal.title}</h3>
                  {achieved
                    ? <p className="goal-achieved">Цель достигнута ✨</p>
                    : totalCnt > 0 && <p className="goal-sub">{doneCnt} из {totalCnt} шагов</p>
                  }
                </div>

                <div className="goal-card-actions">
                  {totalCnt > 0 && (
                    <CircleProgress done={doneCnt} total={totalCnt} />
                  )}
                  {totalCnt > 0 && (
                    <button className="goal-expand-btn" onClick={() => toggleExpand(goal.id)}>
                      {isOpen ? '↑' : '↓'}
                    </button>
                  )}
                  <button className="book-edit" onClick={() => openEdit(goal)}>✏️</button>
                  <button className="book-delete" onClick={() => deleteGoal(goal.id)}>×</button>
                </div>
              </div>

              {isOpen && totalCnt > 0 && (
                <div className="goal-steps">
                  {goal.steps.map(step => (
                    <label key={step.id} className="goal-step">
                      <input
                        type="checkbox"
                        checked={step.done}
                        onChange={() => toggleStep(goal.id, step.id)}
                        className="goal-step-check"
                      />
                      <span className={`goal-step-text${step.done ? ' goal-step-text--done' : ''}`}>
                        {step.text}
                      </span>
                      {step.mins != null && (
                        <span className="goal-step-mins">{step.mins} мин</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="books-form">
          <h2 className="books-form-title">
            {editingId != null ? 'Редактировать цель' : `Новая цель — ${TAB_LABELS[tab]}`}
          </h2>

          <input
            className="books-field"
            placeholder="Название цели *"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
          />

          {/* Steps section */}
          <div className="goal-steps-section">
            <p className="goal-steps-label">Шаги <span className="goal-steps-optional">(необязательно)</span></p>

            {formSteps.map((fs, i) => (
              <div key={i} className="goal-form-step-block">
                <div className="goal-form-step-row">
                  <input
                    className="books-field"
                    placeholder={`Шаг ${i + 1}`}
                    value={fs.text}
                    onChange={e => updateFormStep(i, { text: e.target.value })}
                  />
                  <button type="button" className="tracker-delete" onClick={() => removeFormStep(i)}>×</button>
                </div>
                <div className="goal-mins-row">
                  {GOAL_MINS_PRESETS.map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`goal-mins-btn${fs.mins === m && !fs.customMins ? ' goal-mins-btn--active' : ''}`}
                      onClick={() => updateFormStep(i, { mins: m, customMins: '' })}
                    >{m} мин</button>
                  ))}
                  <input
                    className="goal-mins-custom"
                    type="number"
                    min="1"
                    placeholder="своё"
                    value={fs.customMins}
                    onChange={e => updateFormStep(i, { customMins: e.target.value, mins: null })}
                  />
                </div>
              </div>
            ))}

            <button type="button" className="goal-add-step-btn" onClick={() => setFormSteps(p => [...p, blankStep()])}>
              + Добавить шаг
            </button>
          </div>

          <div className="books-form-actions">
            <button className="books-cancel-btn" onClick={closeForm}>Отмена</button>
            <button className="books-save-btn" onClick={saveGoal} disabled={!formTitle.trim()}>Сохранить</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="books-fab" onClick={openAdd}>+</button>
      )}
    </div>
  )
}

// ── Birthday Screen ───────────────────────────────────────────────────────

interface BdPerson {
  id: number
  emoji: string
  name: string
  day: number
  month: number
  year: number | null
  note: string
}

const BD_EMOJIS = ['👩','👨','👶','👴','👵','🧑','🐱','🐶','💛','⭐']

const BD_MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

function daysUntilBirthday(day: number, month: number): number {
  const today = new Date()
  const y = today.getFullYear()
  const bd = new Date(y, month - 1, day)
  if (bd < today) bd.setFullYear(y + 1)
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((bd.getTime() - todayMid.getTime()) / 86400000)
}

function turnsAge(year: number, day: number, month: number): number {
  const today = new Date()
  let age = today.getFullYear() - year
  if (
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() > day)
  ) age++
  return age
}

function BirthdayScreen(_: { onBack: () => void }) {
  const [people, setPeople] = useLS<BdPerson[]>('ls-birthdays', [])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formEmoji, setFormEmoji] = useState(BD_EMOJIS[0])
  const [formName, setFormName] = useState('')
  const [formDay, setFormDay] = useState('')
  const [formMonth, setFormMonth] = useState('')
  const [formYear, setFormYear] = useState('')
  const [formNote, setFormNote] = useState('')

  const resetForm = () => {
    setFormEmoji(BD_EMOJIS[0]); setFormName(''); setFormDay('')
    setFormMonth(''); setFormYear(''); setFormNote('')
  }

  const openAdd = () => { setEditingId(null); resetForm(); setShowForm(true) }

  const openEdit = (p: BdPerson) => {
    setEditingId(p.id)
    setFormEmoji(p.emoji); setFormName(p.name)
    setFormDay(String(p.day)); setFormMonth(String(p.month))
    setFormYear(p.year != null ? String(p.year) : '')
    setFormNote(p.note)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); resetForm() }

  const canSave = formName.trim() && formDay && formMonth &&
    Number(formDay) >= 1 && Number(formDay) <= 31 &&
    Number(formMonth) >= 1 && Number(formMonth) <= 12

  const savePerson = () => {
    if (!canSave) return
    const base: Omit<BdPerson, 'id'> = {
      emoji: formEmoji,
      name: formName.trim(),
      day: Number(formDay),
      month: Number(formMonth),
      year: formYear.trim() ? Number(formYear) : null,
      note: formNote.trim(),
    }
    if (editingId != null) {
      setPeople(prev => prev.map(p => p.id === editingId ? { id: editingId, ...base } : p))
    } else {
      setPeople(prev => [...prev, { id: Date.now(), ...base }])
    }
    closeForm()
  }

  const deletePerson = (id: number) => setPeople(prev => prev.filter(p => p.id !== id))

  const sorted = [...people].sort((a, b) => daysUntilBirthday(a.day, a.month) - daysUntilBirthday(b.day, b.month))

  return (
    <div className="books-screen">

      <div className="books-header">
        <h1 className="books-title">Дни рождения</h1>
        {people.length > 0 && <p className="books-count">{people.length} {people.length === 1 ? 'человек' : people.length < 5 ? 'человека' : 'человек'}</p>}
      </div>

      {people.length === 0 && !showForm && (
        <p className="books-empty">Добавь близких людей 💛</p>
      )}

      <div className="books-list">
        {sorted.map((person, idx) => {
          const days = daysUntilBirthday(person.day, person.month)
          const isToday = days === 0
          const isSoon = days > 0 && days < 7
          const age = person.year != null ? turnsAge(person.year, person.day, person.month) : null
          const monthName = BD_MONTHS[person.month - 1]

          return (
            <div
              key={person.id}
              className={`bd-card${isToday ? ' bd-card--today' : isSoon ? ' bd-card--soon' : ''}`}
              style={{ background: BOOK_GRADS[idx % BOOK_GRADS.length] }}
            >
              <div className="bd-card-top">
                <span className="bd-emoji" style={isToday ? { filter: 'drop-shadow(0 0 6px #ff3b30)', background: 'rgba(255,59,48,0.15)', borderRadius: '50%', padding: '4px' } : {}}>{person.emoji}</span>
                <div className="bd-info">
                  <h3 className="bd-name">{person.name}</h3>
                  <p className="bd-date">
                    {person.day} {monthName}{person.year ? ` ${person.year}` : ''}
                    {age != null && <span className="bd-age"> · исполнится {age}</span>}
                  </p>
                  {person.note && <p className="bd-note">{person.note}</p>}
                </div>
                <div className="book-card-actions">
                  <button className="book-edit" onClick={() => openEdit(person)}>✏️</button>
                  <button className="book-delete" onClick={() => deletePerson(person.id)}>×</button>
                </div>
              </div>
              <div className="bd-footer">
                {isToday
                  ? <span className="bd-badge bd-badge--today">🎉 Сегодня день рождения!</span>
                  : isSoon
                    ? <span className="bd-badge bd-badge--soon">⏰ Через {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</span>
                    : <span className="bd-days">{days === 365 ? 'Сегодня!' : `${days} ${days % 10 === 1 && days !== 11 ? 'день' : days % 10 >= 2 && days % 10 <= 4 && (days < 10 || days > 20) ? 'дня' : 'дней'}`}</span>
                }
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="books-form">
          <h2 className="books-form-title">{editingId != null ? 'Редактировать' : 'Новый человек'}</h2>

          <div className="tracker-emoji-grid">
            {BD_EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                className={`tracker-emoji-btn${formEmoji === e ? ' tracker-emoji-btn--active' : ''}`}
                onClick={() => setFormEmoji(e)}
              >{e}</button>
            ))}
          </div>

          <input
            className="books-field"
            placeholder="Имя *"
            value={formName}
            onChange={e => setFormName(e.target.value)}
          />

          <div className="bd-date-row">
            <input
              className="books-field bd-date-input"
              type="number" min="1" max="31"
              placeholder="День *"
              value={formDay}
              onChange={e => setFormDay(e.target.value)}
            />
            <input
              className="books-field bd-date-input"
              type="number" min="1" max="12"
              placeholder="Месяц *"
              value={formMonth}
              onChange={e => setFormMonth(e.target.value)}
            />
            <input
              className="books-field bd-year-input"
              type="number" min="1900" max="2099"
              placeholder="Год"
              value={formYear}
              onChange={e => setFormYear(e.target.value)}
            />
          </div>

          <input
            className="books-field"
            placeholder="Заметка (необязательно)"
            value={formNote}
            onChange={e => setFormNote(e.target.value)}
          />

          <div className="books-form-actions">
            <button className="books-cancel-btn" onClick={closeForm}>Отмена</button>
            <button className="books-save-btn" onClick={savePerson} disabled={!canSave}>Сохранить</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="books-fab" onClick={openAdd}>+</button>
      )}
    </div>
  )
}

// ── Finance Screen ────────────────────────────────────────────────────────

type FinType = 'income' | 'expense'

interface FinTransaction {
  id: number
  type: FinType
  amount: number
  categoryKey: string
  date: string      // YYYY-MM-DD
  note: string
}

const FIN_EXPENSE_CATS: { key: string; emoji: string; label: string }[] = [
  { key: 'food',      emoji: '🛒', label: 'Продукты'    },
  { key: 'transport', emoji: '🚗', label: 'Транспорт'   },
  { key: 'cafe',      emoji: '🍽️', label: 'Кафе'        },
  { key: 'clothes',   emoji: '👗', label: 'Одежда'      },
  { key: 'health',    emoji: '💊', label: 'Здоровье'    },
  { key: 'fun',       emoji: '🎉', label: 'Развлечения' },
  { key: 'home',      emoji: '🏠', label: 'Жильё'       },
  { key: 'other_e',   emoji: '📦', label: 'Другое'      },
]

const FIN_INCOME_CATS: { key: string; emoji: string; label: string }[] = [
  { key: 'salary',    emoji: '💼', label: 'Зарплата'    },
  { key: 'gift',      emoji: '🎁', label: 'Подарок'     },
  { key: 'freelance', emoji: '💰', label: 'Фриланс'     },
  { key: 'invest',    emoji: '📈', label: 'Инвестиции'  },
  { key: 'other_i',   emoji: '💛', label: 'Другое'      },
]

function finCat(type: FinType, key: string) {
  const list = type === 'expense' ? FIN_EXPENSE_CATS : FIN_INCOME_CATS
  return list.find(c => c.key === key) ?? { emoji: '📦', label: key }
}

function finFormatAmount(n: number) {
  return n.toLocaleString('ru-RU')
}

function finMonthLabel(offset: number) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

function finMonthKey(offset: number) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function finTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

function finFormatDate(dateStr: string) {
  const [y, m, day] = dateStr.split('-')
  return `${day}.${m}.${y}`
}

function FinBarChart({ transactions }: { transactions: FinTransaction[] }) {
  const expenses = transactions.filter(t => t.type === 'expense')
  const byKey: Record<string, number> = {}
  for (const t of expenses) byKey[t.categoryKey] = (byKey[t.categoryKey] ?? 0) + t.amount
  const sorted = Object.entries(byKey)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  if (sorted.length === 0) return null
  const max = sorted[0][1]
  const BAR_W = 260
  const ROW_H = 28

  return (
    <div className="fin-chart">
      <p className="fin-chart-title">Расходы по категориям</p>
      <svg width="100%" viewBox={`0 0 320 ${sorted.length * ROW_H + 4}`} style={{ overflow: 'visible' }}>
        {sorted.map(([key, amt], i) => {
          const cat = finCat('expense', key)
          const bw = Math.max(4, (amt / max) * BAR_W)
          const y = i * ROW_H
          return (
            <g key={key} transform={`translate(0,${y})`}>
              <text x="0" y="16" fontSize="13" fontFamily="Jost,sans-serif" fill="#6E5F5D">
                {cat.emoji} {cat.label}
              </text>
              <rect x="0" y="19" width={bw} height="6" rx="3" fill="rgba(155,139,132,0.35)" />
              <text x={bw + 6} y="26" fontSize="10" fontFamily="Jost,sans-serif" fill="#9B8B84">
                {finFormatAmount(amt)}₽
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function FinanceScreen(_: { onBack: () => void }) {
  const [transactions, setTransactions] = useLS<FinTransaction[]>('ls-finance', [])
  const [monthOffset, setMonthOffset] = useState(0)
  const [activeTab, setActiveTab] = useState<FinType>('expense')
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<FinType>('expense')
  const [formAmount, setFormAmount] = useState('')
  const [formCat, setFormCat] = useState(FIN_EXPENSE_CATS[0].key)
  const [formDate, setFormDate] = useState(finTodayStr())
  const [formNote, setFormNote] = useState('')

  const monthKey = finMonthKey(monthOffset)
  const monthTx = transactions.filter(t => t.date.startsWith(monthKey))
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  const tabTx = monthTx
    .filter(t => t.type === activeTab)
    .sort((a, b) => b.date.localeCompare(a.date))

  const openForm = () => {
    setFormType('expense')
    setFormAmount('')
    setFormCat(FIN_EXPENSE_CATS[0].key)
    setFormDate(finTodayStr())
    setFormNote('')
    setShowForm(true)
  }

  const closeForm = () => setShowForm(false)

  const catList = formType === 'expense' ? FIN_EXPENSE_CATS : FIN_INCOME_CATS

  const saveTransaction = () => {
    const amt = parseFloat(formAmount.replace(',', '.'))
    if (!amt || amt <= 0) return
    setTransactions(prev => [{
      id: Date.now(),
      type: formType,
      amount: amt,
      categoryKey: formCat,
      date: formDate,
      note: formNote.trim(),
    }, ...prev])
    closeForm()
  }

  const deleteTx = (id: number) => setTransactions(prev => prev.filter(t => t.id !== id))

  return (
    <div className="books-screen">

      {/* Month nav */}
      <div className="tracker-header" style={{ padding: '8px 20px 0' }}>
        <button className="tracker-nav" onClick={() => setMonthOffset(o => o - 1)}>←</button>
        <span className="tracker-month" style={{ fontSize: 18, textTransform: 'capitalize' }}>
          {finMonthLabel(monthOffset)}
        </span>
        <button className="tracker-nav" onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0}>→</button>
      </div>

      {/* Balance header */}
      <div className="fin-header">
        <div className={`fin-balance${balance >= 0 ? ' fin-balance--pos' : ' fin-balance--neg'}`}>
          {balance >= 0 ? '+' : ''}{finFormatAmount(balance)} ₽
        </div>
        <div className="fin-totals">
          <span className="fin-income-total">↑ {finFormatAmount(income)} ₽</span>
          <span className="fin-expense-total">↓ {finFormatAmount(expense)} ₽</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="goals-tabs" style={{ margin: '12px 20px 0' }}>
        <button className={`goals-tab${activeTab === 'income' ? ' goals-tab--active' : ''}`} onClick={() => setActiveTab('income')}>Доходы</button>
        <button className={`goals-tab${activeTab === 'expense' ? ' goals-tab--active' : ''}`} onClick={() => setActiveTab('expense')}>Расходы</button>
      </div>

      {/* Transactions */}
      {tabTx.length === 0 && !showForm && (
        <p className="books-empty">Нет записей за этот месяц</p>
      )}

      <div className="books-list" style={{ marginTop: 12 }}>
        {tabTx.map(tx => {
          const cat = finCat(tx.type, tx.categoryKey)
          return (
            <div key={tx.id} className="fin-tx-card">
              <span className="fin-tx-emoji">{cat.emoji}</span>
              <div className="fin-tx-info">
                <span className="fin-tx-label">{cat.label}</span>
                {tx.note && <span className="fin-tx-note">{tx.note}</span>}
                <span className="fin-tx-date">{finFormatDate(tx.date)}</span>
              </div>
              <span className={`fin-tx-amount${tx.type === 'income' ? ' fin-tx-amount--in' : ' fin-tx-amount--out'}`}>
                {tx.type === 'income' ? '+' : '−'}{finFormatAmount(tx.amount)} ₽
              </span>
              <button className="book-delete" onClick={() => deleteTx(tx.id)}>×</button>
            </div>
          )
        })}
      </div>

      {/* Bar chart */}
      {activeTab === 'expense' && monthTx.some(t => t.type === 'expense') && (
        <FinBarChart transactions={monthTx} />
      )}

      {/* Add form */}
      {showForm && (
        <div className="books-form">
          <h2 className="books-form-title">Новая запись</h2>

          {/* type switch */}
          <div className="film-type-switch">
            <button type="button" className={`film-type-btn${formType === 'income' ? ' film-type-btn--active' : ''}`}
              onClick={() => { setFormType('income'); setFormCat(FIN_INCOME_CATS[0].key) }}>Доход</button>
            <button type="button" className={`film-type-btn${formType === 'expense' ? ' film-type-btn--active' : ''}`}
              onClick={() => { setFormType('expense'); setFormCat(FIN_EXPENSE_CATS[0].key) }}>Расход</button>
          </div>

          <input
            className="books-field"
            type="number"
            min="0"
            placeholder="Сумма *"
            value={formAmount}
            onChange={e => setFormAmount(e.target.value)}
          />

          {/* category grid */}
          <div className="fin-cat-grid">
            {catList.map(c => (
              <button
                key={c.key}
                type="button"
                className={`fin-cat-btn${formCat === c.key ? ' fin-cat-btn--active' : ''}`}
                onClick={() => setFormCat(c.key)}
              >
                <span className="fin-cat-emoji">{c.emoji}</span>
                <span className="fin-cat-label">{c.label}</span>
              </button>
            ))}
          </div>

          <input
            className="books-field"
            type="date"
            value={formDate}
            onChange={e => setFormDate(e.target.value)}
          />

          <input
            className="books-field"
            placeholder="Заметка (необязательно)"
            value={formNote}
            onChange={e => setFormNote(e.target.value)}
          />

          <div className="books-form-actions">
            <button className="books-cancel-btn" onClick={closeForm}>Отмена</button>
            <button className="books-save-btn" onClick={saveTransaction}
              disabled={!formAmount || parseFloat(formAmount) <= 0}>Сохранить</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="books-fab" onClick={openForm}>+</button>
      )}
    </div>
  )
}

// ── Health Screen ─────────────────────────────────────────────────────────

type HealthTab = 'wellness' | 'sport' | 'sleep'
type SleepQuality = 'bad' | 'ok' | 'great'

interface WellnessEntry { date: string; mood: string; energy: number; note: string }
interface WorkoutEntry  { id: number; typeKey: string; minutes: number; date: string }
interface SleepEntry    { date: string; bedtime: string; wakeup: string; hours: number; quality: SleepQuality }

const MOOD_EMOJIS = ['😢','😕','😐','🙂','😊']

const WORKOUT_TYPES = [
  { key: 'run',   emoji: '🏃',  label: 'Бег'        },
  { key: 'gym',   emoji: '🏋️',  label: 'Зал'        },
  { key: 'yoga',  emoji: '🧘',  label: 'Йога'       },
  { key: 'bike',  emoji: '🚴',  label: 'Велосипед'  },
  { key: 'swim',  emoji: '🏊',  label: 'Плавание'   },
  { key: 'walk',  emoji: '🚶',  label: 'Прогулка'   },
  { key: 'other', emoji: '💪',  label: 'Другое'     },
]

const SLEEP_QUALITY: { key: SleepQuality; emoji: string; label: string }[] = [
  { key: 'bad',   emoji: '😴', label: 'Плохо'   },
  { key: 'ok',    emoji: '😌', label: 'Норм'    },
  { key: 'great', emoji: '✨', label: 'Отлично' },
]

const SQ_COLOR: Record<SleepQuality, string> = {
  bad:   'rgba(160,80,80,0.5)',
  ok:    'rgba(155,139,132,0.55)',
  great: 'rgba(90,138,90,0.55)',
}

function healthTodayStr() { return new Date().toISOString().slice(0, 10) }

function calcSleepHours(bed: string, wake: string): number {
  const [bh, bm] = bed.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  let b = bh * 60 + bm, w = wh * 60 + wm
  if (w <= b) w += 1440
  return Math.round((w - b) / 60 * 10) / 10
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10)
  })
}

function shortDate(s: string) {
  const [, m, d] = s.split('-')
  return `${Number(d)} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][Number(m)-1]}`
}

function SleepChart({ entries }: { entries: SleepEntry[] }) {
  const days = last7Days()
  const byDate: Record<string, SleepEntry> = {}
  for (const e of entries) byDate[e.date] = e
  const MAX_H = 10
  const ROW = 30, LW = 44, BW = 190

  return (
    <svg width="100%" viewBox={`0 0 ${LW + BW + 60} ${days.length * ROW + 4}`} style={{ display:'block' }}>
      {days.map((day, i) => {
        const e = byDate[day]
        const y = i * ROW
        const barW = e ? Math.min(1, e.hours / MAX_H) * BW : 0
        const col = e ? SQ_COLOR[e.quality] : 'transparent'
        return (
          <g key={day} transform={`translate(0,${y + 4})`}>
            <text x={LW - 4} y="16" textAnchor="end" fontSize="10" fontFamily="Jost,sans-serif" fill="#9B8B84">
              {shortDate(day)}
            </text>
            <rect x={LW} y="7" width={Math.max(0, barW)} height="12" rx="6" fill={col} />
            {e && (
              <>
                <text x={LW + barW + 5} y="17" fontSize="10" fontFamily="Jost,sans-serif" fill="#6E5F5D">
                  {e.hours}ч
                </text>
                <text x={LW + BW + 26} y="17" fontSize="13" fontFamily="Jost,sans-serif">{
                  SLEEP_QUALITY.find(q => q.key === e.quality)?.emoji
                }</text>
              </>
            )}
            {!e && (
              <text x={LW + 6} y="17" fontSize="10" fontFamily="Jost,sans-serif" fill="rgba(110,95,93,0.3)">—</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function HealthScreen(_: { onBack: () => void }) {
  const [tab, setTab] = useState<HealthTab>('wellness')

  // ── Wellness
  const [wellnessLog, setWellnessLog] = useLS<WellnessEntry[]>('ls-wellness', [])
  const [wMood,   setWMood]   = useState('')
  const [wEnergy, setWEnergy] = useState(5)
  const [wNote,   setWNote]   = useState('')

  // ── Sport
  const [workouts,       setWorkouts]       = useLS<WorkoutEntry[]>('ls-workouts', [])
  const [showWfForm,     setShowWfForm]     = useState(false)
  const [wfType,         setWfType]         = useState(WORKOUT_TYPES[0].key)
  const [wfMins,         setWfMins]         = useState('')
  const [wfDate,         setWfDate]         = useState(healthTodayStr)

  // ── Sleep
  const [sleepLog,     setSleepLog]     = useLS<SleepEntry[]>('ls-sleep', [])
  const [sBedtime,     setSBedtime]     = useState('23:00')
  const [sWakeup,      setSWakeup]      = useState('07:00')
  const [sQuality,     setSQuality]     = useState<SleepQuality>('ok')
  const [sDate,        setSDate]        = useState(healthTodayStr)

  const todayStr = healthTodayStr()

  // pre-fill wellness form when today's entry already exists
  useEffect(() => {
    const entry = wellnessLog.find(e => e.date === todayStr)
    if (entry) { setWMood(entry.mood); setWEnergy(entry.energy); setWNote(entry.note) }
  }, [wellnessLog.length])

  const saveWellness = () => {
    setWellnessLog(prev => [
      { date: todayStr, mood: wMood, energy: wEnergy, note: wNote },
      ...prev.filter(e => e.date !== todayStr),
    ])
  }

  const saveWorkout = () => {
    const mins = parseInt(wfMins)
    if (!mins || mins <= 0) return
    setWorkouts(prev => [{ id: Date.now(), typeKey: wfType, minutes: mins, date: wfDate }, ...prev])
    setWfMins(''); setShowWfForm(false)
  }

  const deleteWorkout = (id: number) => setWorkouts(prev => prev.filter(w => w.id !== id))

  const saveSleep = () => {
    const hours = calcSleepHours(sBedtime, sWakeup)
    setSleepLog(prev => [
      { date: sDate, bedtime: sBedtime, wakeup: sWakeup, hours, quality: sQuality },
      ...prev.filter(e => e.date !== sDate),
    ])
  }

  const today = new Date()
  const monthKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`
  const monthWorkouts = workouts.filter(w => w.date.startsWith(monthKey))

  const TAB_LABELS: Record<HealthTab, string> = {
    wellness: 'Самочувствие', sport: 'Спорт', sleep: 'Сон',
  }

  const energyPct = `${((wEnergy - 1) / 9) * 100}%`

  return (
    <div className="books-screen">
      <div className="books-header">
        <h1 className="books-title">Здоровье</h1>
      </div>

      {/* Tabs */}
      <div className="health-tabs">
        {(['wellness','sport','sleep'] as HealthTab[]).map(t => (
          <button key={t} className={`health-tab${tab === t ? ' health-tab--active' : ''}`} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── WELLNESS ── */}
      {tab === 'wellness' && (
        <div className="health-section">
          <p className="health-section-title">Как ты себя чувствуешь сегодня?</p>

          <div className="health-moods">
            {MOOD_EMOJIS.map(e => (
              <button key={e} type="button"
                className={`health-mood-btn${wMood === e ? ' health-mood-btn--active' : ''}`}
                onClick={() => setWMood(e)}
              >{e}</button>
            ))}
          </div>

          <div className="health-energy-row">
            <span className="health-energy-label">Энергия</span>
            <span className="health-energy-val">{wEnergy}</span>
          </div>
          <input
            type="range" min="1" max="10" value={wEnergy}
            className="wheel-range health-range"
            style={{ '--percent': energyPct } as React.CSSProperties}
            onChange={e => setWEnergy(Number(e.target.value))}
          />
          <div className="health-range-hints"><span>1</span><span>10</span></div>

          <input
            className="books-field"
            placeholder="Заметка (необязательно)"
            value={wNote}
            onChange={e => setWNote(e.target.value)}
          />

          <button
            className="books-save-btn health-save-btn"
            onClick={saveWellness}
            disabled={!wMood}
          >Сохранить день</button>

          {/* History */}
          {wellnessLog.length > 0 && (
            <>
              <p className="health-section-title" style={{ marginTop: 20 }}>Последние 7 дней</p>
              <div className="health-wellness-history">
                {[...last7Days()].reverse().map(day => {
                  const e = wellnessLog.find(x => x.date === day)
                  if (!e) return null
                  return (
                    <div key={day} className="health-wellness-card">
                      <span className="health-wc-emoji">{e.mood}</span>
                      <span className="health-wc-date">{shortDate(day)}</span>
                      <span className="health-wc-energy">⚡{e.energy}</span>
                    </div>
                  )
                }).filter(Boolean)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SPORT ── */}
      {tab === 'sport' && (
        <div className="health-section">
          <p className="health-section-title">Тренировок в этом месяце: <b>{monthWorkouts.length}</b></p>

          {!showWfForm && (
            <button className="health-add-btn" onClick={() => setShowWfForm(true)}>+ Добавить тренировку</button>
          )}

          {showWfForm && (
            <div className="books-form" style={{ margin: '0 0 12px' }}>
              <h2 className="books-form-title">Тренировка</h2>
              <div className="health-workout-types">
                {WORKOUT_TYPES.map(wt => (
                  <button key={wt.key} type="button"
                    className={`health-wtype-btn${wfType === wt.key ? ' health-wtype-btn--active' : ''}`}
                    onClick={() => setWfType(wt.key)}
                  >
                    <span>{wt.emoji}</span><span>{wt.label}</span>
                  </button>
                ))}
              </div>
              <input className="books-field" type="number" min="1" placeholder="Длительность (мин) *"
                value={wfMins} onChange={e => setWfMins(e.target.value)} />
              <input className="books-field" type="date"
                value={wfDate} onChange={e => setWfDate(e.target.value)} />
              <div className="books-form-actions">
                <button className="books-cancel-btn" onClick={() => setShowWfForm(false)}>Отмена</button>
                <button className="books-save-btn" onClick={saveWorkout} disabled={!wfMins || parseInt(wfMins) <= 0}>Сохранить</button>
              </div>
            </div>
          )}

          {workouts.length === 0 && <p className="books-empty">Добавь первую тренировку ✨</p>}

          <div className="books-list" style={{ marginTop: 8 }}>
            {workouts.map(w => {
              const wt = WORKOUT_TYPES.find(t => t.key === w.typeKey)!
              return (
                <div key={w.id} className="health-workout-card">
                  <span className="health-wc-type-emoji">{wt.emoji}</span>
                  <div className="health-wc-info">
                    <span className="health-wc-type-name">{wt.label}</span>
                    <span className="health-wc-meta">{w.minutes} мин · {shortDate(w.date)}</span>
                  </div>
                  <button className="book-delete" onClick={() => deleteWorkout(w.id)}>×</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SLEEP ── */}
      {tab === 'sleep' && (
        <div className="health-section">
          <div className="health-sleep-form">
            <div className="health-sleep-time-row">
              <div className="health-sleep-time-field">
                <label className="health-sleep-time-label">Лёг спать</label>
                <input className="books-field" type="time"
                  value={sBedtime} onChange={e => setSBedtime(e.target.value)} />
              </div>
              <div className="health-sleep-arrow">→</div>
              <div className="health-sleep-time-field">
                <label className="health-sleep-time-label">Проснулся</label>
                <input className="books-field" type="time"
                  value={sWakeup} onChange={e => setSWakeup(e.target.value)} />
              </div>
            </div>

            <div className="health-sleep-hours">
              {calcSleepHours(sBedtime, sWakeup)} ч сна
            </div>

            <div className="health-sleep-quality">
              {SLEEP_QUALITY.map(q => (
                <button key={q.key} type="button"
                  className={`health-sq-btn${sQuality === q.key ? ' health-sq-btn--active' : ''}`}
                  onClick={() => setSQuality(q.key)}
                >
                  <span>{q.emoji}</span><span>{q.label}</span>
                </button>
              ))}
            </div>

            <input className="books-field" type="date"
              value={sDate} onChange={e => setSDate(e.target.value)} />

            <button className="books-save-btn health-save-btn" onClick={saveSleep}>
              Сохранить
            </button>
          </div>

          {sleepLog.length > 0 && (
            <div className="health-sleep-chart-wrap">
              <p className="health-section-title">Сон за 7 дней</p>
              <SleepChart entries={sleepLog} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Relations Screen ──────────────────────────────────────────────────────

type RelCategory = 'all' | 'partner' | 'family' | 'friends' | 'work'

interface RelContact {
  id: number
  emoji: string
  name: string
  category: Exclude<RelCategory, 'all'>
  note: string
  lastContact: string        // YYYY-MM-DD
  history: { date: string; note: string }[]
}

const REL_CATEGORIES: { key: RelCategory; emoji: string; label: string }[] = [
  { key: 'all',     emoji: '',   label: 'Все'      },
  { key: 'partner', emoji: '💑', label: 'Партнёр'  },
  { key: 'family',  emoji: '👨‍👩‍👧', label: 'Семья'    },
  { key: 'friends', emoji: '👫', label: 'Друзья'   },
  { key: 'work',    emoji: '💼', label: 'Коллеги'  },
]

const REL_EMOJIS = ['👩','👨','👶','👴','👵','🧑','💛','⭐']

function relDaysSince(dateStr: string): number {
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.floor(ms / 86400000)
}

function relShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  return `${Number(d)} ${months[Number(m) - 1]}`
}

function RelationsScreen(_: { onBack: () => void }) {
  const [contacts, setContacts]   = useLS<RelContact[]>('ls-contacts', [])
  const [catFilter, setCatFilter] = useState<RelCategory>('all')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formEmoji, setFormEmoji] = useState(REL_EMOJIS[0])
  const [formName,  setFormName]  = useState('')
  const [formCat,   setFormCat]   = useState<Exclude<RelCategory,'all'>>('friends')
  const [formNote,  setFormNote]  = useState('')
  const [histInput, setHistInput] = useState('')

  const todayStr = new Date().toISOString().slice(0, 10)

  const filtered = contacts.filter(c => catFilter === 'all' || c.category === catFilter)

  const toggleExpand = (id: number) =>
    setExpandedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const resetForm = () => {
    setFormEmoji(REL_EMOJIS[0]); setFormName(''); setFormCat('friends'); setFormNote('')
  }

  const openAdd = () => { setEditingId(null); resetForm(); setShowForm(true) }

  const openEdit = (c: RelContact) => {
    setEditingId(c.id)
    setFormEmoji(c.emoji); setFormName(c.name); setFormCat(c.category); setFormNote(c.note)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); resetForm() }

  const saveContact = () => {
    if (!formName.trim()) return
    if (editingId != null) {
      setContacts(prev => prev.map(c => c.id !== editingId ? c : {
        ...c, emoji: formEmoji, name: formName.trim(), category: formCat, note: formNote.trim(),
      }))
    } else {
      setContacts(prev => [...prev, {
        id: Date.now(), emoji: formEmoji, name: formName.trim(),
        category: formCat, note: formNote.trim(),
        lastContact: todayStr, history: [],
      }])
    }
    closeForm()
  }

  const deleteContact = (id: number) => setContacts(prev => prev.filter(c => c.id !== id))

  const markToday = (id: number) =>
    setContacts(prev => prev.map(c => c.id !== id ? c : {
      ...c,
      lastContact: todayStr,
      history: [{ date: todayStr, note: '' }, ...c.history.filter(h => h.date !== todayStr)],
    }))

  const addHistNote = (id: number) => {
    if (!histInput.trim()) return
    setContacts(prev => prev.map(c => c.id !== id ? c : {
      ...c,
      history: [{ date: todayStr, note: histInput.trim() }, ...c.history],
    }))
    setHistInput('')
  }

  const catLabel = (key: Exclude<RelCategory, 'all'>) =>
    REL_CATEGORIES.find(c => c.key === key)!

  return (
    <div className="books-screen">

      <div className="books-header">
        <h1 className="books-title">Отношения</h1>
        {contacts.length > 0 && <p className="books-count">{contacts.length} человек</p>}
      </div>

      {/* Category filter */}
      <div className="rel-cats">
        {REL_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`rel-cat-btn${catFilter === cat.key ? ' rel-cat-btn--active' : ''}`}
            onClick={() => setCatFilter(cat.key)}
          >
            {cat.emoji && <span>{cat.emoji}</span>} {cat.label}
          </button>
        ))}
      </div>

      {contacts.length === 0 && !showForm && (
        <p className="books-empty">Добавь важных людей 💛</p>
      )}
      {contacts.length > 0 && filtered.length === 0 && (
        <p className="books-empty">Никого нет в этой категории</p>
      )}

      <div className="books-list">
        {filtered.map((contact, idx) => {
          const days   = relDaysSince(contact.lastContact)
          const stale  = days > 14
          const isOpen = expandedIds.has(contact.id)
          const cat    = catLabel(contact.category)

          return (
            <div
              key={contact.id}
              className={`rel-card${stale ? ' rel-card--stale' : ''}`}
              style={{ background: BOOK_GRADS[idx % BOOK_GRADS.length] }}
            >
              {/* header row */}
              <div className="rel-card-top">
                <span className="rel-avatar">{contact.emoji}</span>
                <div className="rel-info">
                  <h3 className="rel-name">{contact.name}</h3>
                  <p className="rel-meta">
                    <span className="rel-cat-tag">{cat.emoji} {cat.label}</span>
                    <span className="rel-last">
                      {days === 0 ? 'сегодня' : days === 1 ? 'вчера' : `${days} дн. назад`}
                    </span>
                  </p>
                  {stale && <p className="rel-stale">⏰ Давно не общались</p>}
                </div>
                <div className="book-card-actions">
                  {contact.history.length > 0 || contact.note ? (
                    <button className="goal-expand-btn" onClick={() => toggleExpand(contact.id)}>
                      {isOpen ? '↑' : '↓'}
                    </button>
                  ) : null}
                  <button className="book-edit" onClick={() => openEdit(contact)}>✏️</button>
                  <button className="book-delete" onClick={() => deleteContact(contact.id)}>×</button>
                </div>
              </div>

              {/* mark today */}
              <button
                className="rel-mark-btn"
                onClick={() => markToday(contact.id)}
                disabled={contact.lastContact === todayStr}
              >
                {contact.lastContact === todayStr ? '✓ Общались сегодня' : 'Отметить общение сегодня'}
              </button>

              {/* expanded */}
              {isOpen && (
                <div className="rel-expanded">
                  {contact.note && (
                    <p className="rel-expanded-note">{contact.note}</p>
                  )}

                  {contact.history.length > 0 && (
                    <div className="rel-history">
                      <p className="rel-history-title">История общения</p>
                      {contact.history.slice(0, 10).map((h, i) => (
                        <div key={i} className="rel-history-row">
                          <span className="rel-history-date">{relShortDate(h.date)}</span>
                          {h.note && <span className="rel-history-note">{h.note}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* add note to history */}
                  <div className="rel-hist-input-row">
                    <input
                      className="books-field"
                      placeholder="Заметка о встрече..."
                      value={histInput}
                      onChange={e => setHistInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addHistNote(contact.id) }}
                    />
                    <button
                      className="tracker-add-confirm"
                      style={{ width: 36, height: 36, fontSize: 18, borderRadius: 10 }}
                      onClick={() => addHistNote(contact.id)}
                      disabled={!histInput.trim()}
                    >+</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="books-form">
          <h2 className="books-form-title">
            {editingId != null ? 'Редактировать' : 'Новый контакт'}
          </h2>

          <div className="tracker-emoji-grid">
            {REL_EMOJIS.map(e => (
              <button key={e} type="button"
                className={`tracker-emoji-btn${formEmoji === e ? ' tracker-emoji-btn--active' : ''}`}
                onClick={() => setFormEmoji(e)}
              >{e}</button>
            ))}
          </div>

          <input className="books-field" placeholder="Имя *"
            value={formName} onChange={e => setFormName(e.target.value)} />

          <div className="rel-cat-form-row">
            {REL_CATEGORIES.filter(c => c.key !== 'all').map(cat => (
              <button key={cat.key} type="button"
                className={`film-genre-btn${formCat === cat.key ? ' film-genre-btn--active' : ''}`}
                onClick={() => setFormCat(cat.key as Exclude<RelCategory,'all'>)}
              >{cat.emoji} {cat.label}</button>
            ))}
          </div>

          <input className="books-field" placeholder="Заметка о человеке (интересы, что любит...)"
            value={formNote} onChange={e => setFormNote(e.target.value)} />

          <div className="books-form-actions">
            <button className="books-cancel-btn" onClick={closeForm}>Отмена</button>
            <button className="books-save-btn" onClick={saveContact}
              disabled={!formName.trim()}>Сохранить</button>
          </div>
        </div>
      )}

      {!showForm && (
        <button className="books-fab" onClick={openAdd}>+</button>
      )}
    </div>
  )
}

// ── Self-Development Screen ───────────────────────────────────────────────

type SelfTab = 'courses' | 'skills' | 'ideas' | 'reflection' | 'library'

type CoursePlatform = 'Udemy' | 'YouTube' | 'Книга' | 'Другое'
type CourseStatus   = 'active' | 'done' | 'planned'
interface Course {
  id: number; title: string; platform: CoursePlatform
  progress: number; status: CourseStatus; note: string
}

type SkillCat = 'tech' | 'creative' | 'social' | 'physical'
interface Skill {
  id: number; name: string; level: number; category: SkillCat
}

interface Idea {
  id: number; text: string; date: string; done: boolean
}

interface WeekReflection {
  weekKey: string   // "YYYY-WNN"
  q1: string; q2: string; q3: string; q4: string
}

interface Insight {
  id: number; title: string; body: string; tags: string[]
  source: string; date: string
}

const REFL_QUESTIONS = [
  'Что я узнала нового?',
  'Что далось сложно?',
  'Чем я горжусь?',
  'Что хочу улучшить?',
] as const

function getWeekKey(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + 1 + offset * 7)  // Monday
  const year = d.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(weekNum).padStart(2, '0')}`
}

function getWeekLabel(offset: number): string {
  const RU_MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  const mon = new Date()
  mon.setDate(mon.getDate() - mon.getDay() + 1 + offset * 7)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = (d: Date) => `${d.getDate()} ${RU_MONTHS[d.getMonth()]}`
  return `${fmt(mon)} – ${fmt(sun)}`
}

const SELF_PLATFORMS: CoursePlatform[] = ['Udemy','YouTube','Книга','Другое']
const COURSE_STATUS_MAP: Record<CourseStatus, string> = {
  active: '📚 В процессе', done: '✅ Завершён', planned: '🔜 Запланирован',
}
const SKILL_CATS: { key: SkillCat; label: string }[] = [
  { key: 'tech',     label: '💻 Технический' },
  { key: 'creative', label: '🎨 Творческий'  },
  { key: 'social',   label: '🗣️ Социальный'  },
  { key: 'physical', label: '💪 Физический'  },
]

function SelfScreen(_: { onBack: () => void }) {
  const [tab, setTab] = useState<SelfTab>('courses')

  // Courses state
  const [courses,   setCourses]   = useLS<Course[]>('ls-courses', [])
  const [showCForm, setShowCForm] = useState(false)
  const [editCId,   setEditCId]   = useState<number | null>(null)
  const [cTitle,    setCTitle]    = useState('')
  const [cPlatform, setCPlatform] = useState<CoursePlatform>('Udemy')
  const [cProgress, setCProgress] = useState(0)
  const [cStatus,   setCStatus]   = useState<CourseStatus>('planned')
  const [cNote,     setCNote]     = useState('')

  // Skills state
  const [skills,   setSkills]   = useLS<Skill[]>('ls-skills', [])
  const [showSForm, setShowSForm] = useState(false)
  const [editSId,   setEditSId]   = useState<number | null>(null)
  const [sName,    setSName]    = useState('')
  const [sLevel,   setSLevel]   = useState(3)
  const [sCat,     setSCat]     = useState<SkillCat>('tech')

  // Ideas state
  const [ideas,    setIdeas]    = useLS<Idea[]>('ls-ideas', [])
  const [ideaText, setIdeaText] = useState('')

  // Reflection state
  const [reflOffset,  setReflOffset]  = useState(0)
  const [reflData,    setReflData]    = useLS<Record<string, WeekReflection>>('ls-reflections', {})
  const [reflQ,       setReflQ]       = useState<[string,string,string,string]>(['','','',''])
  const [reflEditing, setReflEditing] = useState(true)

  // Library state
  const [insights,    setInsights]   = useLS<Insight[]>('ls-insights', [])
  const [insightSearch, setInsightSearch] = useState('')
  const [showIForm,   setShowIForm]  = useState(false)
  const [editIId,     setEditIId]    = useState<number | null>(null)
  const [iTitle,      setITitle]     = useState('')
  const [iBody,       setIBody]      = useState('')
  const [iTagInput,   setITagInput]  = useState('')
  const [iTags,       setITags]      = useState<string[]>([])
  const [iSource,     setISource]    = useState('')

  const todayStr = new Date().toISOString().slice(0, 10)

  // ── Courses handlers ─────────────────────────────────────
  const resetCForm = () => { setCTitle(''); setCPlatform('Udemy'); setCProgress(0); setCStatus('planned'); setCNote('') }
  const openAddCourse = () => { setEditCId(null); resetCForm(); setShowCForm(true) }
  const openEditCourse = (c: Course) => {
    setEditCId(c.id); setCTitle(c.title); setCPlatform(c.platform)
    setCProgress(c.progress); setCStatus(c.status); setCNote(c.note)
    setShowCForm(true)
  }
  const closeCForm = () => { setShowCForm(false); setEditCId(null); resetCForm() }
  const saveCourse = () => {
    if (!cTitle.trim()) return
    if (editCId != null) {
      setCourses(prev => prev.map(c => c.id !== editCId ? c : {
        ...c, title: cTitle.trim(), platform: cPlatform, progress: cProgress, status: cStatus, note: cNote.trim()
      }))
    } else {
      setCourses(prev => [...prev, { id: Date.now(), title: cTitle.trim(), platform: cPlatform, progress: cProgress, status: cStatus, note: cNote.trim() }])
    }
    closeCForm()
  }
  const deleteCourse = (id: number) => setCourses(prev => prev.filter(c => c.id !== id))

  // ── Skills handlers ──────────────────────────────────────
  const resetSForm = () => { setSName(''); setSLevel(3); setSCat('tech') }
  const openAddSkill = () => { setEditSId(null); resetSForm(); setShowSForm(true) }
  const openEditSkill = (s: Skill) => {
    setEditSId(s.id); setSName(s.name); setSLevel(s.level); setSCat(s.category)
    setShowSForm(true)
  }
  const closeSForm = () => { setShowSForm(false); setEditSId(null); resetSForm() }
  const saveSkill = () => {
    if (!sName.trim()) return
    if (editSId != null) {
      setSkills(prev => prev.map(s => s.id !== editSId ? s : { ...s, name: sName.trim(), level: sLevel, category: sCat }))
    } else {
      setSkills(prev => [...prev, { id: Date.now(), name: sName.trim(), level: sLevel, category: sCat }])
    }
    closeSForm()
  }
  const deleteSkill = (id: number) => setSkills(prev => prev.filter(s => s.id !== id))

  // ── Ideas handlers ───────────────────────────────────────
  const addIdea = () => {
    if (!ideaText.trim()) return
    setIdeas(prev => [{ id: Date.now(), text: ideaText.trim(), date: todayStr, done: false }, ...prev])
    setIdeaText('')
  }
  const toggleIdeaDone = (id: number) =>
    setIdeas(prev => prev.map(i => i.id !== id ? i : { ...i, done: !i.done }))
  const deleteIdea = (id: number) => setIdeas(prev => prev.filter(i => i.id !== id))

  // ── Reflection handlers ──────────────────────────────────
  const reflWeekKey = getWeekKey(reflOffset)

  useEffect(() => {
    const saved = reflData[reflWeekKey]
    setReflQ(saved ? [saved.q1, saved.q2, saved.q3, saved.q4] : ['','','',''])
    setReflEditing(!saved)
  }, [reflWeekKey])

  const saveReflection = () => {
    setReflData(prev => ({
      ...prev,
      [reflWeekKey]: { weekKey: reflWeekKey, q1: reflQ[0], q2: reflQ[1], q3: reflQ[2], q4: reflQ[3] }
    }))
    setReflEditing(false)
  }

  const setReflAnswer = (i: number, val: string) =>
    setReflQ(prev => { const next = [...prev] as [string,string,string,string]; next[i] = val; return next })

  // ── Library handlers ─────────────────────────────────────
  const resetIForm = () => { setITitle(''); setIBody(''); setITagInput(''); setITags([]); setISource('') }
  const openAddInsight = () => { setEditIId(null); resetIForm(); setShowIForm(true) }
  const openEditInsight = (ins: Insight) => {
    setEditIId(ins.id); setITitle(ins.title); setIBody(ins.body)
    setITags(ins.tags); setITagInput(''); setISource(ins.source)
    setShowIForm(true)
  }
  const closeIForm = () => { setShowIForm(false); setEditIId(null); resetIForm() }
  const saveInsight = () => {
    if (!iTitle.trim()) return
    if (editIId != null) {
      setInsights(prev => prev.map(ins => ins.id !== editIId ? ins : {
        ...ins, title: iTitle.trim(), body: iBody.trim(), tags: iTags, source: iSource.trim()
      }))
    } else {
      setInsights(prev => [{ id: Date.now(), title: iTitle.trim(), body: iBody.trim(), tags: iTags, source: iSource.trim(), date: todayStr }, ...prev])
    }
    closeIForm()
  }
  const deleteInsight = (id: number) => setInsights(prev => prev.filter(i => i.id !== id))

  const addTag = () => {
    const t = iTagInput.trim()
    if (t && !iTags.includes(t)) setITags(prev => [...prev, t])
    setITagInput('')
  }
  const removeTag = (t: string) => setITags(prev => prev.filter(x => x !== t))

  const filteredInsights = useMemo(() => {
    const q = insightSearch.toLowerCase().trim()
    if (!q) return insights
    return insights.filter(ins =>
      ins.title.toLowerCase().includes(q) ||
      ins.tags.some(t => t.toLowerCase().includes(q))
    )
  }, [insights, insightSearch])

  const TABS: { key: SelfTab; label: string; emoji: string }[] = [
    { key: 'courses',    label: 'Курсы',      emoji: '📚' },
    { key: 'skills',     label: 'Навыки',     emoji: '⚡' },
    { key: 'ideas',      label: 'Идеи',       emoji: '💡' },
    { key: 'reflection', label: 'Рефлексия',  emoji: '🪞' },
    { key: 'library',    label: 'Библиотека', emoji: '🗂️' },
  ]

  return (
    <div className="books-screen">

      <div className="books-header">
        <h1 className="books-title">Саморазвитие</h1>
      </div>

      {/* Tab strip */}
      <div className="self-tabs">
        {TABS.map(t => (
          <button key={t.key}
            className={`self-tab${tab === t.key ? ' self-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          ><span style={{ fontSize: 15 }}>{t.emoji}</span> {t.label}</button>
        ))}
      </div>

      {/* ── COURSES ── */}
      {tab === 'courses' && (
        <>
          {courses.length === 0 && !showCForm && (
            <p className="books-empty">Добавь первый курс 📚</p>
          )}
          <div className="books-list">
            {courses.map((c, idx) => (
              <div key={c.id} className="self-card" style={{ background: BOOK_GRADS[idx % BOOK_GRADS.length] }}>
                <div className="book-card-top">
                  <div className="self-card-info">
                    <p className="self-card-title">{c.title}</p>
                    <p className="self-card-meta">
                      <span className="self-platform-tag">{c.platform}</span>
                      <span className="self-status">{COURSE_STATUS_MAP[c.status]}</span>
                    </p>
                  </div>
                  <div className="book-card-actions">
                    <button className="book-edit" onClick={() => openEditCourse(c)}>✏️</button>
                    <button className="book-delete" onClick={() => deleteCourse(c.id)}>×</button>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="self-progress-wrap">
                  <div className="self-progress-bar">
                    <div className="self-progress-fill" style={{ width: `${c.progress}%` }} />
                  </div>
                  <span className="self-progress-label">{c.progress}%</span>
                </div>
                {c.note && <p className="self-card-note">{c.note}</p>}
              </div>
            ))}
          </div>

          {showCForm && (
            <div className="books-form">
              <h2 className="books-form-title">{editCId != null ? 'Редактировать курс' : 'Новый курс'}</h2>
              <input className="books-field" placeholder="Название *"
                value={cTitle} onChange={e => setCTitle(e.target.value)} />

              {/* Platform */}
              <div className="self-btn-row">
                {SELF_PLATFORMS.map(p => (
                  <button key={p} type="button"
                    className={`film-genre-btn${cPlatform === p ? ' film-genre-btn--active' : ''}`}
                    onClick={() => setCPlatform(p)}
                  >{p}</button>
                ))}
              </div>

              {/* Status */}
              <div className="self-btn-row">
                {(Object.entries(COURSE_STATUS_MAP) as [CourseStatus, string][]).map(([k, label]) => (
                  <button key={k} type="button"
                    className={`film-genre-btn${cStatus === k ? ' film-genre-btn--active' : ''}`}
                    onClick={() => setCStatus(k)}
                  >{label}</button>
                ))}
              </div>

              {/* Progress slider */}
              <div className="self-slider-wrap">
                <label className="self-slider-label">Прогресс: {cProgress}%</label>
                <input type="range" min={0} max={100} step={5}
                  className="self-range"
                  value={cProgress}
                  style={{ '--percent': `${cProgress}%` } as React.CSSProperties}
                  onChange={e => setCProgress(Number(e.target.value))} />
              </div>

              <input className="books-field" placeholder="Заметка (необязательно)"
                value={cNote} onChange={e => setCNote(e.target.value)} />

              <div className="books-form-actions">
                <button className="books-cancel-btn" onClick={closeCForm}>Отмена</button>
                <button className="books-save-btn" onClick={saveCourse} disabled={!cTitle.trim()}>Сохранить</button>
              </div>
            </div>
          )}
          {!showCForm && (
            <button className="books-fab" onClick={openAddCourse}>+</button>
          )}
        </>
      )}

      {/* ── SKILLS ── */}
      {tab === 'skills' && (
        <>
          {skills.length === 0 && !showSForm && (
            <p className="books-empty">Добавь первый навык ⭐</p>
          )}
          <div className="books-list">
            {skills.map((s, idx) => {
              const cat = SKILL_CATS.find(c => c.key === s.category)!
              return (
                <div key={s.id} className="self-card" style={{ background: BOOK_GRADS[idx % BOOK_GRADS.length] }}>
                  <div className="book-card-top">
                    <div className="self-card-info">
                      <p className="self-card-title">{s.name}</p>
                      <p className="self-card-meta">
                        <span className="self-platform-tag">{cat.label}</span>
                      </p>
                      <div className="self-stars">
                        {[1,2,3,4,5].map(n => (
                          <span key={n} className={`self-star${n <= s.level ? ' self-star--on' : ''}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <div className="book-card-actions">
                      <button className="book-edit" onClick={() => openEditSkill(s)}>✏️</button>
                      <button className="book-delete" onClick={() => deleteSkill(s.id)}>×</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {showSForm && (
            <div className="books-form">
              <h2 className="books-form-title">{editSId != null ? 'Редактировать навык' : 'Новый навык'}</h2>
              <input className="books-field" placeholder="Название навыка *"
                value={sName} onChange={e => setSName(e.target.value)} />

              {/* Category */}
              <div className="self-btn-row" style={{ flexWrap: 'wrap' }}>
                {SKILL_CATS.map(c => (
                  <button key={c.key} type="button"
                    className={`film-genre-btn${sCat === c.key ? ' film-genre-btn--active' : ''}`}
                    onClick={() => setSCat(c.key)}
                  >{c.label}</button>
                ))}
              </div>

              {/* Star level picker */}
              <div className="self-star-pick">
                <span className="self-slider-label">Уровень:</span>
                <div className="self-stars">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" className="self-star-btn"
                      onClick={() => setSLevel(n)}
                    >
                      <span className={`self-star${n <= sLevel ? ' self-star--on' : ''}`}>★</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="books-form-actions">
                <button className="books-cancel-btn" onClick={closeSForm}>Отмена</button>
                <button className="books-save-btn" onClick={saveSkill} disabled={!sName.trim()}>Сохранить</button>
              </div>
            </div>
          )}
          {!showSForm && (
            <button className="books-fab" onClick={openAddSkill}>+</button>
          )}
        </>
      )}

      {/* ── IDEAS ── */}
      {tab === 'ideas' && (
        <>
          {/* Quick input */}
          <div className="self-idea-input-row">
            <textarea className="self-idea-textarea" placeholder="Новая идея..."
              value={ideaText} onChange={e => setIdeaText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addIdea() } }}
              rows={2}
            />
            <button className="tracker-add-confirm"
              style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}
              onClick={addIdea} disabled={!ideaText.trim()}
            >+</button>
          </div>

          {ideas.length === 0 && (
            <p className="books-empty">Записывай идеи, пока не забыл 💡</p>
          )}
          <div className="books-list">
            {ideas.map((idea, idx) => (
              <div key={idea.id}
                className={`self-idea-card${idea.done ? ' self-idea-card--done' : ''}`}
                style={{ background: BOOK_GRADS[idx % BOOK_GRADS.length] }}
              >
                <div className="book-card-top">
                  <p className="self-idea-text">{idea.text}</p>
                  <div className="book-card-actions">
                    <button className="book-delete" onClick={() => deleteIdea(idea.id)}>×</button>
                  </div>
                </div>
                <div className="self-idea-footer">
                  <span className="self-idea-date">{idea.date}</span>
                  <button
                    className={`self-idea-done-btn${idea.done ? ' self-idea-done-btn--active' : ''}`}
                    onClick={() => toggleIdeaDone(idea.id)}
                  >{idea.done ? '✅ Реализовано' : 'Реализовано ✅'}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── REFLECTION ── */}
      {tab === 'reflection' && (
        <div className="refl-wrap">
          {/* Week navigator */}
          <div className="refl-week-nav">
            <button className="refl-nav-btn" onClick={() => setReflOffset(o => o - 1)}>←</button>
            <span className="refl-week-label">
              {reflOffset === 0 ? 'Эта неделя' : reflOffset === -1 ? 'Прошлая неделя' : 'Неделя'}
              <br />
              <span className="refl-week-dates">{getWeekLabel(reflOffset)}</span>
            </span>
            <button className="refl-nav-btn" onClick={() => setReflOffset(o => o + 1)}
              disabled={reflOffset >= 0}>→</button>
          </div>

          {reflEditing ? (
            /* ── Edit mode ── */
            <>
              <div className="refl-questions">
                {REFL_QUESTIONS.map((q, i) => (
                  <div key={i} className="refl-question-block">
                    <label className="refl-question-label">{q}</label>
                    <textarea className="refl-textarea"
                      rows={3}
                      value={reflQ[i]}
                      onChange={e => setReflAnswer(i, e.target.value)}
                      placeholder="Ответ..."
                    />
                  </div>
                ))}
              </div>
              <button className="books-save-btn refl-save-btn" onClick={saveReflection}>
                Сохранить неделю
              </button>
            </>
          ) : (
            /* ── View mode ── */
            <>
              <div className="refl-questions">
                {REFL_QUESTIONS.map((q, i) => {
                  const answer = reflQ[i]
                  return (
                    <div key={i} className="refl-view-card">
                      <p className="refl-view-question">{q}</p>
                      <p className="refl-view-answer">
                        {answer.trim() ? answer : <span className="refl-view-empty">—</span>}
                      </p>
                    </div>
                  )
                })}
              </div>
              <button className="refl-edit-btn" onClick={() => setReflEditing(true)}>
                Редактировать
              </button>
            </>
          )}
        </div>
      )}

      {/* ── LIBRARY ── */}
      {tab === 'library' && (
        <>
          {/* Search */}
          <input
            className="books-field"
            style={{ display: 'block', width: 'calc(100% - 40px)', margin: '0 20px 14px' }}
            placeholder="Поиск по заголовку или тегу..."
            value={insightSearch}
            onChange={e => setInsightSearch(e.target.value)}
          />

          {insights.length === 0 && !showIForm && (
            <p className="books-empty">Сохраняй инсайты из книг и курсов 💡</p>
          )}
          {insights.length > 0 && filteredInsights.length === 0 && (
            <p className="books-empty">Ничего не найдено</p>
          )}

          <div className="books-list">
            {filteredInsights.map((ins, idx) => (
              <div key={ins.id} className="self-card" style={{ background: BOOK_GRADS[idx % BOOK_GRADS.length] }}>
                <div className="book-card-top">
                  <div className="self-card-info">
                    <p className="self-card-title">{ins.title}</p>
                    {ins.source && <p className="self-status">{ins.source}</p>}
                  </div>
                  <div className="book-card-actions">
                    <button className="book-edit" onClick={() => openEditInsight(ins)}>✏️</button>
                    <button className="book-delete" onClick={() => deleteInsight(ins.id)}>×</button>
                  </div>
                </div>
                {ins.body && <p className="self-card-note" style={{ fontStyle: 'normal', fontSize: 13 }}>{ins.body}</p>}
                {ins.tags.length > 0 && (
                  <div className="insight-tags">
                    {ins.tags.map(t => (
                      <span key={t} className="insight-tag">#{t}</span>
                    ))}
                  </div>
                )}
                <p className="self-idea-date">{ins.date}</p>
              </div>
            ))}
          </div>

          {showIForm && (
            <div className="books-form">
              <h2 className="books-form-title">{editIId != null ? 'Редактировать инсайт' : 'Новый инсайт'}</h2>
              <input className="books-field" placeholder="Заголовок *"
                value={iTitle} onChange={e => setITitle(e.target.value)} />
              <textarea className="refl-textarea" rows={4}
                placeholder="Текст инсайта..."
                value={iBody} onChange={e => setIBody(e.target.value)} />
              <input className="books-field" placeholder="Источник (книга, курс...)"
                value={iSource} onChange={e => setISource(e.target.value)} />

              {/* Tag input */}
              <div className="insight-tag-row">
                <input className="books-field" placeholder="Добавить тег..."
                  style={{ flex: 1, margin: 0 }}
                  value={iTagInput}
                  onChange={e => setITagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                />
                <button className="tracker-add-confirm"
                  style={{ width: 36, height: 36, fontSize: 18, borderRadius: 10, flexShrink: 0 }}
                  onClick={addTag} disabled={!iTagInput.trim()}>+</button>
              </div>
              {iTags.length > 0 && (
                <div className="insight-tags">
                  {iTags.map(t => (
                    <button key={t} className="insight-tag insight-tag--removable" onClick={() => removeTag(t)}>
                      #{t} ×
                    </button>
                  ))}
                </div>
              )}

              <div className="books-form-actions">
                <button className="books-cancel-btn" onClick={closeIForm}>Отмена</button>
                <button className="books-save-btn" onClick={saveInsight} disabled={!iTitle.trim()}>Сохранить</button>
              </div>
            </div>
          )}

          {!showIForm && (
            <button className="books-fab" onClick={openAddInsight}>+</button>
          )}
        </>
      )}
    </div>
  )
}

// ── Work Screen ────────────────────────────────────────────────────────────

type WorkTab = 'schedule' | 'tasks' | 'notes'

interface ShiftType {
  id: number
  name: string
  color: string
}

interface WorkTask {
  id: number
  text: string
  done: boolean
}

interface WorkNote {
  id: number
  text: string
  date: string
}

const SHIFT_COLORS = ['#E0BFB6', '#9B8B84', '#B8C9B0', '#B0BED4', '#D4B0C9', '#D4CDB0', '#C9B0B0', '#B0C9C9']

function WorkScreen(_: { onBack: () => void }) {
  const [tab, setTab] = useState<WorkTab>('schedule')

  // Schedule
  const [shiftTypes, setShiftTypes] = useLS<ShiftType[]>('ls-shift-types', [
    { id: 1, name: 'Рабочий', color: '#E0BFB6' },
    { id: 2, name: 'Выходной', color: '#B8C9B0' },
  ])
  const [schedule, setSchedule] = useLS<Record<string, number[]>>('ls-schedule', {})
  const [schedMonth, setSchedMonth] = useState(new Date())
  const [showShiftForm, setShowShiftForm] = useState(false)
  const [editShiftId, setEditShiftId] = useState<number | null>(null)
  const [sName, setSName] = useState('')
  const [sColor, setSColor] = useState(SHIFT_COLORS[0])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const monthStart = new Date(schedMonth.getFullYear(), schedMonth.getMonth(), 1)
  const monthEnd = new Date(schedMonth.getFullYear(), schedMonth.getMonth() + 1, 0)
  const startDow = (monthStart.getDay() + 6) % 7 // Mon=0
  const daysInMonth = monthEnd.getDate()

  const fmtDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const prevMonth = () => setSchedMonth(new Date(schedMonth.getFullYear(), schedMonth.getMonth() - 1, 1))
  const nextMonth = () => setSchedMonth(new Date(schedMonth.getFullYear(), schedMonth.getMonth() + 1, 1))

  const monthName = schedMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

  const assignShift = (dateStr: string, shiftId: number) => {
    setSchedule(prev => {
      const current = prev[dateStr] || []
      let next: number[]
      if (current.includes(shiftId)) {
        next = current.filter(id => id !== shiftId)
      } else if (current.length < 2) {
        next = [...current, shiftId]
      } else {
        next = [current[1], shiftId] // заменяем первую если уже 2
      }
      if (next.length === 0) {
        const r = { ...prev }; delete r[dateStr]; return r
      }
      return { ...prev, [dateStr]: next }
    })
  }

  const saveShift = () => {
    if (!sName.trim()) return
    if (editShiftId !== null) {
      setShiftTypes(prev => prev.map(s => s.id === editShiftId ? { ...s, name: sName, color: sColor } : s))
    } else {
      setShiftTypes(prev => [...prev, { id: Date.now(), name: sName, color: sColor }])
    }
    setSName(''); setSColor(SHIFT_COLORS[0]); setEditShiftId(null); setShowShiftForm(false)
  }

  const deleteShift = (id: number) => {
    setShiftTypes(prev => prev.filter(s => s.id !== id))
    setSchedule(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { if ((next[k] as unknown as number[]).includes(id)) delete next[k] })
      return next
    })
  }

  // Tasks
  const [tasks, setTasks] = useLS<WorkTask[]>('ls-work-tasks', [])
  const [taskInput, setTaskInput] = useState('')
  const [editTaskId, setEditTaskId] = useState<number | null>(null)
  const [editTaskText, setEditTaskText] = useState('')
  const addTask = () => {
    if (!taskInput.trim()) return
    setTasks(prev => [...prev, { id: Date.now(), text: taskInput.trim(), done: false }])
    setTaskInput('')
  }
  const toggleTask = (id: number) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const deleteTask = (id: number) => setTasks(prev => prev.filter(t => t.id !== id))
  const startEditTask = (t: WorkTask) => { setEditTaskId(t.id); setEditTaskText(t.text) }
  const saveEditTask = () => {
    if (!editTaskText.trim()) return
    setTasks(prev => prev.map(t => t.id === editTaskId ? { ...t, text: editTaskText.trim() } : t))
    setEditTaskId(null); setEditTaskText('')
  }

  // Notes
  const [notes, setNotes] = useLS<WorkNote[]>('ls-work-notes', [])
  const [noteInput, setNoteInput] = useState('')
  const addNote = () => {
    if (!noteInput.trim()) return
    setNotes(prev => [...prev, { id: Date.now(), text: noteInput.trim(), date: new Date().toLocaleDateString('ru-RU') }])
    setNoteInput('')
  }
  const deleteNote = (id: number) => setNotes(prev => prev.filter(n => n.id !== id))

  const today = new Date()
  const todayStr = fmtDate(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="detail-screen">
      <h1 className="detail-title" style={{ marginBottom: 16 }}>Работа</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([['schedule', 'График'], ['tasks', 'Задачи'], ['notes', 'Заметки']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, padding: '8px', borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13, background: tab === key ? '#9B8B84' : 'rgba(235,229,228,0.6)', color: tab === key ? '#fff' : '#6E5F5D' }}>
            {label}
          </button>
        ))}
      </div>

      {/* SCHEDULE TAB */}
      {tab === 'schedule' && (
        <>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={prevMonth} style={{ background: 'rgba(235,229,228,0.6)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: '#6E5F5D' }}>←</button>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#6E5F5D', textTransform: 'capitalize' }}>{monthName}</span>
            <button onClick={nextMonth} style={{ background: 'rgba(235,229,228,0.6)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: '#6E5F5D' }}>→</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#9B8B84', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 16 }}>
            {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1
              const dateStr = fmtDate(schedMonth.getFullYear(), schedMonth.getMonth(), d)
              const shiftIds = schedule[dateStr] || []
              const shifts = shiftIds.map(id => shiftTypes.find(s => s.id === id)).filter(Boolean)
              const isToday = dateStr === todayStr
              const isSelected = selectedDay === dateStr
              return (
                <div key={d} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  style={{ borderRadius: 8, minHeight: 62, padding: '4px 2px', cursor: 'pointer', textAlign: 'center', background: shifts.length === 1 ? shifts[0]!.color : 'rgba(235,229,228,0.35)', border: isSelected ? '2px solid #6E5F5D' : isToday ? '2px solid #9B8B84' : '1px solid rgba(255,255,255,0.4)', overflow: 'hidden' }}>
                  <div style={{ fontSize: 11, color: isToday ? '#6E5F5D' : '#9B8B84', fontWeight: isToday ? 700 : 400 }}>{d}</div>
                  {shifts.length === 1 && <div style={{ fontSize: 9, color: '#6E5F5D', marginTop: 2, lineHeight: 1.2 }}>{shifts[0]!.name}</div>}
                  {shifts.length === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2 }}>
                      {shifts.map(s => (
                        <div key={s!.id} style={{ background: s!.color, borderRadius: 4, fontSize: 8, color: '#6E5F5D', padding: '1px 2px', lineHeight: 1.3 }}>{s!.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Shift picker popup */}
          {selectedDay && (
            <div style={{ background: 'rgba(235,229,228,0.85)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.6)' }}>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, color: '#9B8B84', marginBottom: 10 }}>
                Выбери смену на {new Date(selectedDay + 'T00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}:
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {shiftTypes.map(s => (
                  <button key={s.id} onClick={() => assignShift(selectedDay, s.id)}
                    style={{ padding: '6px 14px', borderRadius: 12, border: (schedule[selectedDay] || []).includes(s.id) ? '2px solid #6E5F5D' : '2px solid transparent', background: s.color, color: '#6E5F5D', cursor: 'pointer', fontSize: 13, fontFamily: 'Jost, sans-serif' }}>
                    {s.name}
                  </button>
                ))}
                <button onClick={() => setSelectedDay(null)}
                  style={{ padding: '6px 14px', borderRadius: 12, border: 'none', background: 'rgba(155,139,132,0.2)', color: '#9B8B84', cursor: 'pointer', fontSize: 13 }}>
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Shift types */}
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#6E5F5D', marginBottom: 8 }}>Типы смен</p>
          {shiftTypes.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, background: 'rgba(235,229,228,0.4)', borderRadius: 12, padding: '8px 12px' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#6E5F5D' }}>{s.name}</span>
              <button onClick={() => { setEditShiftId(s.id); setSName(s.name); setSColor(s.color); setShowShiftForm(true) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✏️</button>
              <button onClick={() => deleteShift(s.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9B8B84' }}>×</button>
            </div>
          ))}

          {showShiftForm ? (
            <div style={{ background: 'rgba(235,229,228,0.6)', borderRadius: 16, padding: 16, marginTop: 8 }}>
              <input className="books-field" placeholder="Название смены" value={sName} onChange={e => setSName(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {SHIFT_COLORS.map(c => (
                  <div key={c} onClick={() => setSColor(c)}
                    style={{ width: 28, height: 28, borderRadius: 8, background: c, cursor: 'pointer', border: sColor === c ? '3px solid #6E5F5D' : '3px solid transparent' }} />
                ))}
              </div>
              <div className="books-form-actions" style={{ marginTop: 12 }}>
                <button className="books-cancel-btn" onClick={() => { setShowShiftForm(false); setSName(''); setEditShiftId(null) }}>Отмена</button>
                <button className="books-save-btn" onClick={saveShift} disabled={!sName.trim()}>Сохранить</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowShiftForm(true)}
              style={{ marginTop: 8, width: '100%', padding: '10px', borderRadius: 14, border: '1px dashed #9B8B84', background: 'transparent', color: '#9B8B84', cursor: 'pointer', fontSize: 13, fontFamily: 'Jost, sans-serif' }}>
              + Добавить тип смены
            </button>
          )}
        </>
      )}

      {/* TASKS TAB */}
      {tab === 'tasks' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input className="books-field" placeholder="Новая задача..." value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              style={{ flex: 1, marginBottom: 0 }} />
            <button onClick={addTask}
              style={{ padding: '0 16px', borderRadius: 14, border: 'none', background: '#9B8B84', color: '#fff', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13 }}>
              +
            </button>
          </div>
          {tasks.length === 0 && <p style={{ textAlign: 'center', color: '#9B8B84', padding: '32px 0' }}>Рабочих задач пока нет ✨</p>}
          {tasks.map(t => (
            <div key={t.id} className="book-card" style={{ marginBottom: 10 }}>
              {editTaskId === t.id ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="books-field" value={editTaskText} onChange={e => setEditTaskText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEditTask()}
                    style={{ flex: 1, marginBottom: 0 }} autoFocus />
                  <button onClick={saveEditTask}
                    style={{ padding: '0 14px', borderRadius: 12, border: 'none', background: '#9B8B84', color: '#fff', cursor: 'pointer', fontSize: 13 }}>ОК</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#9B8B84', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#6E5F5D', textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.5 : 1 }}>{t.text}</span>
                  <button onClick={() => startEditTask(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }}>✏️</button>
                  <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B8B84', fontSize: 18 }}>×</button>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* NOTES TAB */}
      {tab === 'notes' && (
        <>
          <textarea className="books-field" placeholder="Новая заметка..." value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            style={{ minHeight: 80, resize: 'vertical', marginBottom: 8 }} />
          <button onClick={addNote}
            style={{ width: '100%', padding: '10px', borderRadius: 14, border: 'none', background: '#9B8B84', color: '#fff', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13, marginBottom: 16 }}>
            Добавить заметку
          </button>
          {notes.length === 0 && <p style={{ textAlign: 'center', color: '#9B8B84', padding: '32px 0' }}>Заметок пока нет ✨</p>}
          {notes.map(n => (
            <div key={n.id} className="book-card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#6E5F5D', flex: 1, margin: 0 }}>{n.text}</p>
                <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B8B84', fontSize: 18, marginLeft: 8 }}>×</button>
              </div>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9B8B84', margin: '6px 0 0' }}>{n.date}</p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ── Study Screen ────────────────────────────────────────────────────────────

type StudyTab = 'schedule' | 'subjects' | 'tasks'

const STUDY_WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const SUBJECT_COLORS = ['#E0BFB6', '#9B8B84', '#B8C9B0', '#B0BED4', '#D4B0C9', '#D4CDB0', '#C9B0B0']
const URGENCY_LABELS = { hot: '🔴 Горит', soon: '🟡 Скоро', calm: '🟢 Не срочно' } as const
type Urgency = keyof typeof URGENCY_LABELS

interface StudyLesson {
  id: number
  day: number // 0=Пн
  time: string
  name: string
  room: string
  subjectId?: number
}

interface StudySubject {
  id: number
  name: string
  teacher: string
  color: string
  progress: number // 0-5 stars
}

interface StudyTask {
  id: number
  text: string
  subjectId?: number
  deadline: string
  urgency: Urgency
  done: boolean
}

function StudyScreen(_: { onBack: () => void }) {
  const [tab, setTab] = useState<StudyTab>('schedule')
  const [weekOffset, setWeekOffset] = useState(0)

  // Schedule
  const [lessons, setLessons] = useLS<StudyLesson[]>('ls-lessons', [])
  const [showLForm, setShowLForm] = useState(false)
  const [lDay, setLDay] = useState(0)
  const [lTime, setLTime] = useState('09:00')
  const [lName, setLName] = useState('')
  const [lRoom, setLRoom] = useState('')
  const [lSubjectId, setLSubjectId] = useState<number | undefined>()

  const resetLForm = () => { setLName(''); setLRoom(''); setLTime('09:00'); setLDay(0); setLSubjectId(undefined) }
  const addLesson = () => {
    if (!lName.trim()) return
    setLessons(prev => [...prev, { id: Date.now(), day: lDay, time: lTime, name: lName.trim(), room: lRoom.trim(), subjectId: lSubjectId }])
    setShowLForm(false); resetLForm()
  }
  const deleteLesson = (id: number) => setLessons(prev => prev.filter(l => l.id !== id))

  // Get week dates
  const getWeekDates = () => {
    const now = new Date()
    const dow = (now.getDay() + 6) % 7
    const mon = new Date(now); mon.setDate(now.getDate() - dow + weekOffset * 7)
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
  }
  const weekDates = getWeekDates()
  const weekLabel = `${weekDates[0].getDate()} – ${weekDates[6].getDate()} ${weekDates[6].toLocaleDateString('ru-RU', { month: 'long' })}`

  // Subjects
  const [subjects, setSubjects] = useLS<StudySubject[]>('ls-subjects', [])
  const [showSForm, setShowSForm] = useState(false)
  const [editSId, setEditSId] = useState<number | null>(null)
  const [sName, setSName] = useState('')
  const [sTeacher, setSTeacher] = useState('')
  const [sColor, setSColor] = useState(SUBJECT_COLORS[0])
  const [sProgress, setSProgress] = useState(0)

  const resetSForm = () => { setSName(''); setSTeacher(''); setSColor(SUBJECT_COLORS[0]); setSProgress(0); setEditSId(null) }
  const openAddSubject = () => { resetSForm(); setShowSForm(true) }
  const openEditSubject = (s: StudySubject) => { setSName(s.name); setSTeacher(s.teacher); setSColor(s.color); setSProgress(s.progress); setEditSId(s.id); setShowSForm(true) }
  const saveSubject = () => {
    if (!sName.trim()) return
    if (editSId !== null) {
      setSubjects(prev => prev.map(s => s.id === editSId ? { ...s, name: sName, teacher: sTeacher, color: sColor, progress: sProgress } : s))
    } else {
      setSubjects(prev => [...prev, { id: Date.now(), name: sName, teacher: sTeacher, color: sColor, progress: sProgress }])
    }
    setShowSForm(false); resetSForm()
  }
  const deleteSubject = (id: number) => setSubjects(prev => prev.filter(s => s.id !== id))

  // Tasks
  const [studyTasks, setStudyTasks] = useLS<StudyTask[]>('ls-study-tasks', [])
  const [showTForm, setShowTForm] = useState(false)
  const [tText, setTText] = useState('')
  const [tSubjectId, setTSubjectId] = useState<number | undefined>()
  const [tDeadline, setTDeadline] = useState('')
  const [tUrgency, setTUrgency] = useState<Urgency>('soon')

  const addStudyTask = () => {
    if (!tText.trim()) return
    setStudyTasks(prev => [...prev, { id: Date.now(), text: tText.trim(), subjectId: tSubjectId, deadline: tDeadline, urgency: tUrgency, done: false }])
    setShowTForm(false); setTText(''); setTSubjectId(undefined); setTDeadline(''); setTUrgency('soon')
  }
  const [editSTId, setEditSTId] = useState<number | null>(null)
  const [editSTText, setEditSTText] = useState('')
  const [editSTUrgency, setEditSTUrgency] = useState<Urgency>('soon')
  const [editSTDeadline, setEditSTDeadline] = useState('')
  const [editSTSubjectId, setEditSTSubjectId] = useState<number | undefined>()
  const startEditST = (t: StudyTask) => { setEditSTId(t.id); setEditSTText(t.text); setEditSTUrgency(t.urgency); setEditSTDeadline(t.deadline); setEditSTSubjectId(t.subjectId) }
  const saveEditST = () => {
    if (!editSTText.trim()) return
    setStudyTasks(prev => prev.map(t => t.id === editSTId ? { ...t, text: editSTText.trim(), urgency: editSTUrgency, deadline: editSTDeadline, subjectId: editSTSubjectId } : t))
    setEditSTId(null)
  }
  const toggleStudyTask = (id: number) => setStudyTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const deleteStudyTask = (id: number) => setStudyTasks(prev => prev.filter(t => t.id !== id))

  const cardStyle = { background: 'rgba(235,229,228,0.45)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.5)', marginBottom: 10 }

  return (
    <div className="detail-screen">
      <h1 className="detail-title" style={{ marginBottom: 16 }}>Учёба</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([['schedule', 'Расписание'], ['subjects', 'Предметы'], ['tasks', 'Задания']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, padding: '8px', borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13, background: tab === key ? '#9B8B84' : 'rgba(235,229,228,0.6)', color: tab === key ? '#fff' : '#6E5F5D' }}>
            {label}
          </button>
        ))}
      </div>

      {/* SCHEDULE */}
      {tab === 'schedule' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'rgba(235,229,228,0.6)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: '#6E5F5D' }}>←</button>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#6E5F5D' }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: 'rgba(235,229,228,0.6)', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: 16, color: '#6E5F5D' }}>→</button>
          </div>

          {STUDY_WEEK_DAYS.map((day, idx) => {
            const dayLessons = lessons.filter(l => l.day === idx).sort((a, b) => a.time.localeCompare(b.time))
            const date = weekDates[idx]
            const isToday = weekOffset === 0 && idx === (new Date().getDay() + 6) % 7
            return (
              <div key={idx} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? '#6E5F5D' : '#9B8B84' }}>
                    {day} {date.getDate()}
                  </span>
                  {isToday && <span style={{ fontSize: 10, background: '#9B8B84', color: '#fff', borderRadius: 8, padding: '1px 8px' }}>сегодня</span>}
                </div>
                {dayLessons.length === 0
                  ? <div style={{ ...cardStyle, color: '#9B8B84', fontSize: 12, textAlign: 'center', padding: '8px' }}>Нет занятий</div>
                  : dayLessons.map(l => {
                      const subj = subjects.find(s => s.id === l.subjectId)
                      return (
                        <div key={l.id} style={{ ...cardStyle, borderLeft: subj ? `4px solid ${subj.color}` : '4px solid rgba(155,139,132,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ minWidth: 44, fontFamily: 'Jost, sans-serif', fontSize: 12, color: '#9B8B84' }}>{l.time}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#6E5F5D' }}>{l.name}</div>
                            {l.room && <div style={{ fontSize: 11, color: '#9B8B84' }}>📍 {l.room}</div>}
                          </div>
                          <button onClick={() => deleteLesson(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B8B84', fontSize: 16 }}>×</button>
                        </div>
                      )
                    })}
              </div>
            )
          })}

          {showLForm ? (
            <div style={{ ...cardStyle, marginTop: 8 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#6E5F5D', marginBottom: 12 }}>Новое занятие</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {STUDY_WEEK_DAYS.map((d, i) => (
                  <button key={i} onClick={() => setLDay(i)}
                    style={{ padding: '4px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, background: lDay === i ? '#9B8B84' : 'rgba(235,229,228,0.6)', color: lDay === i ? '#fff' : '#6E5F5D' }}>{d}</button>
                ))}
              </div>
              <input type="time" value={lTime} onChange={e => setLTime(e.target.value)} className="books-field" />
              <input className="books-field" placeholder="Название предмета *" value={lName} onChange={e => setLName(e.target.value)} />
              <input className="books-field" placeholder="Аудитория (необязательно)" value={lRoom} onChange={e => setLRoom(e.target.value)} />
              {subjects.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {subjects.map(s => (
                    <button key={s.id} onClick={() => setLSubjectId(lSubjectId === s.id ? undefined : s.id)}
                      style={{ padding: '4px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, background: lSubjectId === s.id ? s.color : 'rgba(235,229,228,0.6)', color: '#6E5F5D' }}>{s.name}</button>
                  ))}
                </div>
              )}
              <div className="books-form-actions" style={{ marginTop: 12 }}>
                <button className="books-cancel-btn" onClick={() => { setShowLForm(false); resetLForm() }}>Отмена</button>
                <button className="books-save-btn" onClick={addLesson} disabled={!lName.trim()}>Добавить</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowLForm(true)}
              style={{ width: '100%', padding: '10px', borderRadius: 14, border: '1px dashed #9B8B84', background: 'transparent', color: '#9B8B84', cursor: 'pointer', fontSize: 13, fontFamily: 'Jost, sans-serif', marginTop: 8 }}>
              + Добавить занятие
            </button>
          )}
        </>
      )}

      {/* SUBJECTS */}
      {tab === 'subjects' && (
        <>
          {subjects.length === 0 && !showSForm && <p style={{ textAlign: 'center', color: '#9B8B84', padding: '32px 0' }}>Добавь свои предметы 📚</p>}
          {subjects.map(s => (
            <div key={s.id} style={{ ...cardStyle, borderLeft: `4px solid ${s.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, color: '#6E5F5D' }}>{s.name}</div>
                  {s.teacher && <div style={{ fontSize: 12, color: '#9B8B84', marginTop: 2 }}>👤 {s.teacher}</div>}
                  <div style={{ marginTop: 6 }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ fontSize: 16, color: i <= s.progress ? '#C4A882' : '#D4C9C6' }}>★</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEditSubject(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15 }}>✏️</button>
                  <button onClick={() => deleteSubject(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B8B84', fontSize: 18 }}>×</button>
                </div>
              </div>
            </div>
          ))}

          {showSForm ? (
            <div style={{ ...cardStyle, marginTop: 8 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#6E5F5D', marginBottom: 12 }}>{editSId ? 'Редактировать' : 'Новый предмет'}</p>
              <input className="books-field" placeholder="Название *" value={sName} onChange={e => setSName(e.target.value)} />
              <input className="books-field" placeholder="Преподаватель (необязательно)" value={sTeacher} onChange={e => setSTeacher(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, margin: '10px 0' }}>
                {SUBJECT_COLORS.map(c => (
                  <div key={c} onClick={() => setSColor(c)} style={{ width: 26, height: 26, borderRadius: 8, background: c, cursor: 'pointer', border: sColor === c ? '3px solid #6E5F5D' : '3px solid transparent' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} onClick={() => setSProgress(i)} style={{ fontSize: 24, cursor: 'pointer', color: i <= sProgress ? '#C4A882' : '#D4C9C6' }}>★</span>
                ))}
              </div>
              <div className="books-form-actions">
                <button className="books-cancel-btn" onClick={() => { setShowSForm(false); resetSForm() }}>Отмена</button>
                <button className="books-save-btn" onClick={saveSubject} disabled={!sName.trim()}>Сохранить</button>
              </div>
            </div>
          ) : (
            <button onClick={openAddSubject}
              style={{ width: '100%', padding: '10px', borderRadius: 14, border: '1px dashed #9B8B84', background: 'transparent', color: '#9B8B84', cursor: 'pointer', fontSize: 13, fontFamily: 'Jost, sans-serif', marginTop: 8 }}>
              + Добавить предмет
            </button>
          )}
        </>
      )}

      {/* TASKS */}
      {tab === 'tasks' && (
        <>
          {studyTasks.length === 0 && !showTForm && <p style={{ textAlign: 'center', color: '#9B8B84', padding: '32px 0' }}>Заданий пока нет ✨</p>}
          {studyTasks.map(t => {
            const subj = subjects.find(s => s.id === t.subjectId)
            return (
              <div key={t.id} style={{ ...cardStyle, borderLeft: subj ? `4px solid ${subj.color}` : '4px solid rgba(155,139,132,0.3)', opacity: t.done ? 0.55 : 1 }}>
                {editSTId === t.id ? (
                  <div>
                    <input className="books-field" value={editSTText} onChange={e => setEditSTText(e.target.value)} autoFocus />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
                      {(['hot', 'soon', 'calm'] as Urgency[]).map(u => (
                        <button key={u} onClick={() => setEditSTUrgency(u)}
                          style={{ padding: '4px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, background: editSTUrgency === u ? '#9B8B84' : 'rgba(235,229,228,0.6)', color: editSTUrgency === u ? '#fff' : '#6E5F5D' }}>
                          {URGENCY_LABELS[u]}
                        </button>
                      ))}
                    </div>
                    {subjects.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {subjects.map(s => (
                          <button key={s.id} onClick={() => setEditSTSubjectId(editSTSubjectId === s.id ? undefined : s.id)}
                            style={{ padding: '3px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, background: editSTSubjectId === s.id ? s.color : 'rgba(235,229,228,0.6)', color: '#6E5F5D' }}>
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <input className="books-field" type="date" value={editSTDeadline} onChange={e => setEditSTDeadline(e.target.value)} style={{ marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={saveEditST} className="books-save-btn" style={{ flex: 1 }}>Сохранить</button>
                      <button onClick={() => setEditSTId(null)} className="books-cancel-btn" style={{ flex: 1 }}>Отмена</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <input type="checkbox" checked={t.done} onChange={() => toggleStudyTask(t.id)} style={{ marginTop: 3, accentColor: '#9B8B84', cursor: 'pointer' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 14, color: '#6E5F5D', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#9B8B84' }}>{URGENCY_LABELS[t.urgency]}</span>
                        {subj && <span style={{ fontSize: 11, background: subj.color, color: '#6E5F5D', borderRadius: 8, padding: '1px 8px' }}>{subj.name}</span>}
                        {t.deadline && <span style={{ fontSize: 11, color: '#9B8B84' }}>📅 {t.deadline}</span>}
                      </div>
                    </div>
                    <button onClick={() => startEditST(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}>✏️</button>
                    <button onClick={() => deleteStudyTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B8B84', fontSize: 18 }}>×</button>
                  </div>
                )}
              </div>
            )
          })}

          {showTForm ? (
            <div style={{ ...cardStyle, marginTop: 8 }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#6E5F5D', marginBottom: 12 }}>Новое задание</p>
              <input className="books-field" placeholder="Задание *" value={tText} onChange={e => setTText(e.target.value)} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
                {(['hot', 'soon', 'calm'] as Urgency[]).map(u => (
                  <button key={u} onClick={() => setTUrgency(u)}
                    style={{ padding: '4px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, background: tUrgency === u ? '#9B8B84' : 'rgba(235,229,228,0.6)', color: tUrgency === u ? '#fff' : '#6E5F5D' }}>
                    {URGENCY_LABELS[u]}
                  </button>
                ))}
              </div>
              {subjects.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {subjects.map(s => (
                    <button key={s.id} onClick={() => setTSubjectId(tSubjectId === s.id ? undefined : s.id)}
                      style={{ padding: '4px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, background: tSubjectId === s.id ? s.color : 'rgba(235,229,228,0.6)', color: '#6E5F5D' }}>{s.name}</button>
                  ))}
                </div>
              )}
              <input type="date" className="books-field" value={tDeadline} onChange={e => setTDeadline(e.target.value)} />
              <div className="books-form-actions" style={{ marginTop: 12 }}>
                <button className="books-cancel-btn" onClick={() => setShowTForm(false)}>Отмена</button>
                <button className="books-save-btn" onClick={addStudyTask} disabled={!tText.trim()}>Добавить</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowTForm(true)}
              style={{ width: '100%', padding: '10px', borderRadius: 14, border: '1px dashed #9B8B84', background: 'transparent', color: '#9B8B84', cursor: 'pointer', fontSize: 13, fontFamily: 'Jost, sans-serif', marginTop: 8 }}>
              + Добавить задание
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ── Wishlist Screen ────────────────────────────────────────────────────────

type WishPriority = 'high' | 'medium' | 'low'

interface WishItem {
  id: number
  title: string
  category: string
  price?: string
  link?: string
  priority: WishPriority
  emoji: string
  fulfilled: boolean
}

const BASE_WISH_CATEGORIES = ['👗 Вещи', '✈️ Путешествия', '🍽️ Впечатления', '📚 Обучение', '💻 Техника']
// ── Checklists Screen ─────────────────────────────────────────────────────

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

interface CheckItem { id: number; text: string; done: boolean }

const SEASON_CONFIG: Record<Season, {
  label: string; emoji: string;
  bg: string; headerBg: string; accent: string; textColor: string; cardBg: string;
  ideas: string[];
}> = {
  spring: {
    label: 'Чек-лист Весна', emoji: '🌸',
    bg: 'linear-gradient(160deg, #f9e8f0 0%, #e8f5e9 50%, #fce4ec 100%)',
    headerBg: 'rgba(248,187,208,0.35)',
    accent: '#c06080',
    textColor: '#7b3f5e',
    cardBg: 'rgba(255,240,245,0.6)',
    ideas: ['Генеральная уборка 🧹', 'Разобрать гардероб', 'Посадить цветы 🌱', 'Обновить декор дома', 'Пройти медосмотр', 'Записаться к стоматологу', 'Начать бегать на улице 🏃', 'Обновить косметичку', 'Разобрать документы', 'Съездить на природу', 'Открыть окна — проветрить всё!', 'Купить весенние вещи'],
  },
  summer: {
    label: 'Чек-лист Лето', emoji: '☀️',
    bg: 'linear-gradient(160deg, #fffde7 0%, #e0f7fa 50%, #f9fbe7 100%)',
    headerBg: 'rgba(255,236,100,0.3)',
    accent: '#e6a817',
    textColor: '#7a5800',
    cardBg: 'rgba(255,253,230,0.65)',
    ideas: ['Съездить к морю 🌊', 'Попробовать новый спорт', 'Устроить пикник 🧺', 'Прочитать 3 книги', 'Выучить новый рецепт', 'Сделать фотоальбом', 'Встретить рассвет ☀️', 'Посетить фестиваль', 'Научиться плавать', 'Попробовать сёрфинг', 'Купить велосипед 🚲', 'Провести ночь под звёздами'],
  },
  autumn: {
    label: 'Чек-лист Осень', emoji: '🍂',
    bg: 'linear-gradient(160deg, #fff3e0 0%, #fbe9e7 50%, #f3e5d0 100%)',
    headerBg: 'rgba(230,150,60,0.25)',
    accent: '#bf6f30',
    textColor: '#7a3d00',
    cardBg: 'rgba(255,243,224,0.65)',
    ideas: ['Записаться на курс', 'Обновить осенний гардероб', 'Сделать заготовки 🫙', 'Купить тёплый плед', 'Пройтись по осеннему парку 🍁', 'Начать новый проект', 'Поставить цели до конца года', 'Сделать витаминный запас', 'Записаться в тренажёрный зал', 'Устроить уютный вечер кино 🎬', 'Съездить за грибами', 'Обновить рабочее место'],
  },
  winter: {
    label: 'Чек-лист Зима', emoji: '❄️',
    bg: 'linear-gradient(160deg, #e8eaf6 0%, #e3f2fd 50%, #ede7f6 100%)',
    headerBg: 'rgba(140,180,230,0.28)',
    accent: '#4a6fa5',
    textColor: '#1a3560',
    cardBg: 'rgba(232,240,255,0.6)',
    ideas: ['Написать письмо себе на год', 'Подготовить подарки заранее 🎁', 'Освоить вязание или хобби', 'Посмотреть список фильмов', 'Слепить снеговика ☃️', 'Поехать кататься на лыжах', 'Устроить глинтвейн-вечер', 'Подвести итоги года', 'Составить план на новый год', 'Попробовать прорубь 🧊', 'Украсить дом к Новому году', 'Испечь имбирное печенье 🍪'],
  },
}

function ChecklistsScreen(_: { onBack: () => void }) {
  const [openSeason, setOpenSeason] = useState<Season | null>(null)
  const [lists, setLists] = useLS<Record<Season, CheckItem[]>>('ls-checklists', { spring: [], summer: [], autumn: [], winter: [] })
  const [newText, setNewText] = useState('')

  const season = openSeason ? SEASON_CONFIG[openSeason] : null

  const addItem = () => {
    if (!newText.trim() || !openSeason) return
    setLists(prev => ({ ...prev, [openSeason]: [...prev[openSeason], { id: Date.now(), text: newText.trim(), done: false }] }))
    setNewText('')
  }
  const toggleItem = (id: number) => {
    if (!openSeason) return
    setLists(prev => ({ ...prev, [openSeason]: prev[openSeason].map(i => i.id === id ? { ...i, done: !i.done } : i) }))
  }
  const deleteItem = (id: number) => {
    if (!openSeason) return
    setLists(prev => ({ ...prev, [openSeason]: prev[openSeason].filter(i => i.id !== id) }))
  }

  const downloadChecklist = () => {
    if (!openSeason) return
    const cfg = SEASON_CONFIG[openSeason]
    const items = lists[openSeason]
    const W = 900
    const COLS = 2
    const ITEM_H = 56
    const TOP_PAD = 230
    const COL_PAD = 60
    const COL_GAP = 60
    const colW = (W - COL_PAD * 2 - COL_GAP) / COLS
    const img = new Image()
    img.onload = () => renderCanvas(img)
    img.onerror = () => renderCanvas(null)
    img.src = window.location.origin + '/softly/seasons/' + openSeason + '.jpg'
    return
    function renderCanvas(bgImg: HTMLImageElement | null) {
    const rows = Math.ceil(items.length / COLS)
    const H = Math.max(720, TOP_PAD + rows * ITEM_H + 110)
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!


    // Draw photo background (cover fit)
    if (bgImg) {
      const scale = Math.max(W / bgImg.width, H / bgImg.height)
      const bw = bgImg.width * scale; const bh = bgImg.height * scale
      ctx.drawImage(bgImg, (W - bw) / 2, (H - bh) / 2, bw, bh)
    }

    // Dark overlay for text readability
    const overlayColors: Record<Season, string> = {
      summer: 'rgba(5,15,40,0.52)', autumn: 'rgba(10,3,0,0.55)',
      spring: 'rgba(15,5,20,0.50)', winter: 'rgba(2,5,15,0.55)',
    }
    ctx.fillStyle = overlayColors[openSeason!]
    ctx.fillRect(0, 0, W, H)

    // ── Title ────────────────────────────────────────────────
    const titleColors: Record<Season, string> = {
      summer: '#fff9c4', autumn: '#fff3e0', spring: '#ffe0ee', winter: '#e8f4ff',
    }
    const titleColor = titleColors[openSeason!]
    const seasonWord = cfg.label.replace('Чек-лист ', '').toUpperCase()

    ctx.textAlign = 'center'
    ctx.fillStyle = titleColor
    ctx.font = 'bold 90px Arial Black, Arial, sans-serif'
    ctx.fillText(seasonWord, W / 2, 108)

    // "ЧЕК-ЛИСТ" with box
    const word2 = 'ЧЕК-ЛИСТ'
    ctx.font = 'bold 52px Arial Black, Arial, sans-serif'
    ctx.textBaseline = 'alphabetic'
    const m2 = ctx.measureText(word2)
    const ascent = m2.actualBoundingBoxAscent
    const descent = m2.actualBoundingBoxDescent
    const padH = 36; const padV = 18
    const bW2 = m2.width + padH * 2
    const bH2 = ascent + descent + padV * 2
    const bX2 = W / 2 - bW2 / 2
    const bY2 = 116
    const textBaseline = bY2 + padV + ascent
    ctx.strokeStyle = titleColor; ctx.lineWidth = 3.5
    ctx.beginPath(); ctx.roundRect(bX2, bY2, bW2, bH2, bH2 / 2); ctx.stroke()
    ctx.fillStyle = titleColor
    ctx.fillText(word2, W / 2, textBaseline)

    // ── Checklist items ──────────────────────────────────────
    const itemColor = titleColors[openSeason!]
    const cbColor: Record<Season, string> = {
      summer: 'rgba(255,240,120,0.8)', autumn: 'rgba(255,190,100,0.8)',
      spring: 'rgba(255,180,200,0.8)', winter: 'rgba(180,210,255,0.8)',
    }
    const checkColor: Record<Season, string> = {
      summer: '#ffd700', autumn: '#ff9944', spring: '#ff70a0', winter: '#88bbff',
    }
    ctx.textAlign = 'left'
    ctx.font = '21px Arial, sans-serif'
    const CB = 22

    items.forEach((item, idx) => {
      const col = idx % COLS
      const row = Math.floor(idx / COLS)
      const x = COL_PAD + col * (colW + COL_GAP)
      const y = TOP_PAD + row * ITEM_H

      ctx.strokeStyle = cbColor[openSeason!]; ctx.lineWidth = 2
      ctx.beginPath(); ctx.roundRect(x, y - CB + 4, CB, CB, 4); ctx.stroke()
      if (item.done) {
        ctx.fillStyle = checkColor[openSeason!]
        ctx.font = 'bold 17px Arial'; ctx.fillText('✓', x + 4, y + 2)
        ctx.font = '21px Arial, sans-serif'
      }
      ctx.fillStyle = item.done ? 'rgba(255,255,255,0.4)' : itemColor
      const maxTextW = colW - CB - 22
      const words2 = item.text.split(' ')
      let line = ''; let lineY = y
      for (const w of words2) {
        const test = line ? line + ' ' + w : w
        if (ctx.measureText(test).width > maxTextW && line) {
          ctx.fillText(line, x + CB + 10, lineY); line = w; lineY += 26
        } else line = test
      }
      ctx.fillText(line, x + CB + 10, lineY)
    })

    // Footer
    const done = items.filter(i => i.done).length
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.font = '17px Arial, sans-serif'
    ctx.fillText(`Выполнено: ${done} / ${items.length}`, W / 2, H - 28)

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob!)
      const a = document.createElement('a')
      a.href = url; a.download = `${cfg.label}.png`; a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
    } // end renderCanvas
  }

  // Season detail view
  if (openSeason && season) {
    const items = lists[openSeason]
    const done = items.filter(i => i.done).length
    return (
      <div style={{ minHeight: '100vh', background: season.bg, padding: '0 0 80px' }}>
        {/* Header */}
        <div style={{ background: season.headerBg, backdropFilter: 'blur(10px)', padding: '20px 20px 16px', borderBottom: `1px solid ${season.accent}33` }}>
          <button onClick={() => setOpenSeason(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: season.textColor, fontSize: 15, fontFamily: 'Jost, sans-serif', marginBottom: 12, padding: 0 }}>
            ← Назад
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 26, color: season.textColor, fontWeight: 600 }}>
                {season.emoji} {season.label.replace('Чек-лист ', '')}
              </div>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, color: season.accent, marginTop: 4 }}>
                {done}/{items.length} выполнено
              </div>
            </div>
            <button onClick={downloadChecklist}
              style={{ background: season.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 14px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⬇️ Скачать
            </button>
          </div>
          {/* Progress bar */}
          {items.length > 0 && (
            <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.4)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
              <div style={{ width: `${(done / items.length) * 100}%`, height: '100%', background: season.accent, borderRadius: 6, transition: 'width 0.3s' }} />
            </div>
          )}
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          {/* Add item */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              className="books-field"
              placeholder="Добавить пункт..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              style={{ flex: 1, marginBottom: 0, background: season.cardBg, borderColor: `${season.accent}55` }}
            />
            <button onClick={addItem}
              style={{ background: season.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '0 16px', cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>
              +
            </button>
          </div>

          {/* Ideas */}
          {(() => {
            const cfg = SEASON_CONFIG[openSeason!]
            const usedTexts = items.map(i => i.text)
            const available = cfg.ideas.filter(idea => !usedTexts.includes(idea))
            if (available.length === 0) return null
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: season.accent, marginBottom: 8, opacity: 0.8 }}>
                  💡 Идеи для списка — нажми чтобы добавить:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {available.map(idea => (
                    <button key={idea} onClick={() => {
                      setLists(prev => ({ ...prev, [openSeason!]: [...prev[openSeason!], { id: Date.now() + Math.random(), text: idea, done: false }] }))
                    }}
                      style={{ background: season.cardBg, border: `1px solid ${season.accent}55`, borderRadius: 20, padding: '5px 12px', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 12, color: season.textColor, transition: 'all 0.15s' }}>
                      + {idea}
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Items */}
          {items.length === 0 && (
            <p style={{ textAlign: 'center', color: season.accent, padding: '20px 0', fontFamily: 'Jost, sans-serif', fontSize: 14 }}>
              Выбери идею выше или добавь свою {season.emoji}
            </p>
          )}
          {items.map(item => (
            <div key={item.id} style={{ background: season.cardBg, backdropFilter: 'blur(8px)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, border: `1px solid ${season.accent}33`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => toggleItem(item.id)}
                style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${season.accent}`, background: item.done ? season.accent : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', transition: 'all 0.2s' }}>
                {item.done ? '✓' : ''}
              </button>
              <span style={{ flex: 1, fontFamily: 'Jost, sans-serif', fontSize: 14, color: season.textColor, textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.55 : 1 }}>
                {item.text}
              </span>
              <button onClick={() => deleteItem(item.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: season.accent, fontSize: 18, opacity: 0.6, padding: '0 2px' }}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Main screen — 4 season cards
  return (
    <div className="detail-screen" style={{ justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: '#6E5F5D', marginBottom: 6, padding: '0 20px', textAlign: 'center' }}>Чек-листы</div>
      <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, color: '#9B8B84', marginBottom: 32, padding: '0 20px', textAlign: 'center' }}>Выбери сезон</div>
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {(['spring', 'summer', 'autumn', 'winter'] as Season[]).map(s => {
          const cfg = SEASON_CONFIG[s]
          const total = lists[s].length
          const done = lists[s].filter(i => i.done).length
          return (
            <button key={s} onClick={() => setOpenSeason(s)}
              style={{ background: cfg.bg, border: `1px solid ${cfg.accent}44`, borderRadius: 20, padding: '20px 14px', cursor: 'pointer', textAlign: 'left', position: 'relative', overflow: 'hidden', minHeight: 130 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{cfg.emoji}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: cfg.textColor, fontWeight: 600, lineHeight: 1.2 }}>{cfg.label.replace('Чек-лист ', '')}</div>
              {total > 0 && (
                <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: cfg.accent, marginTop: 6 }}>
                  {done}/{total} пунктов
                </div>
              )}
              {total === 0 && (
                <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: cfg.accent, marginTop: 6, opacity: 0.7 }}>
                  Пусто
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const WISH_EMOJIS = ['🌟', '💫', '✨', '🎀', '🌸', '🦋', '🍀', '🎯', '💎', '🌈']
const PRIORITY_LABELS: Record<WishPriority, string> = { high: '🔥 Очень хочу', medium: '⭐ Хочу', low: '💭 Когда-нибудь' }

function WishlistScreen(_: { onBack: () => void }) {
  const [items, setItems] = useLS<WishItem[]>('ls-wishlist', [])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [filterCat, setFilterCat] = useState<string>('Все')
  const [filterPri, setFilterPri] = useState<WishPriority | 'Все'>('Все')
  const [showFulfilled, setShowFulfilled] = useState(false)
  const [customCategories, setCustomCategories] = useLS<string[]>('ls-wish-cats', [])
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const allCategories = [...BASE_WISH_CATEGORIES, ...customCategories]

  const addCustomCategory = () => {
    const name = newCatName.trim()
    if (!name || allCategories.includes(name)) return
    setCustomCategories(prev => [...prev, name])
    setFCat(name)
    setNewCatName('')
    setShowAddCat(false)
  }

  const [fTitle, setFTitle] = useState('')
  const [fCat, setFCat] = useState<string>('👗 Вещи')
  const [fPrice, setFPrice] = useState('')
  const [fLink, setFLink] = useState('')
  const [fPriority, setFPriority] = useState<WishPriority>('medium')
  const [fEmoji, setFEmoji] = useState('🌟')

  const resetForm = () => { setFTitle(''); setFCat('🎁 Другое'); setFPrice(''); setFLink(''); setFPriority('medium'); setFEmoji('🌟'); setEditId(null) }

  const openAdd = () => { resetForm(); setShowForm(true) }
  const openEdit = (w: WishItem) => { setFTitle(w.title); setFCat(w.category); setFPrice(w.price || ''); setFLink(w.link || ''); setFPriority(w.priority); setFEmoji(w.emoji); setEditId(w.id); setShowForm(true) }

  const save = () => {
    if (!fTitle.trim()) return
    if (editId !== null) {
      setItems(prev => prev.map(w => w.id === editId ? { ...w, title: fTitle, category: fCat, price: fPrice || undefined, link: fLink || undefined, priority: fPriority, emoji: fEmoji } : w))
    } else {
      setItems(prev => [...prev, { id: Date.now(), title: fTitle, category: fCat, price: fPrice || undefined, link: fLink || undefined, priority: fPriority, emoji: fEmoji, fulfilled: false }])
    }
    setShowForm(false); resetForm()
  }

  const fulfill = (id: number) => setItems(prev => prev.map(w => w.id === id ? { ...w, fulfilled: true } : w))
  const remove = (id: number) => setItems(prev => prev.filter(w => w.id !== id))

  const active = items.filter(w => !w.fulfilled && (filterCat === 'Все' || w.category === filterCat) && (filterPri === 'Все' || w.priority === filterPri))
  const fulfilled = items.filter(w => w.fulfilled)

  return (
    <div className="detail-screen">
      <h1 className="detail-title" style={{ marginBottom: 4 }}>Список желаний</h1>
      <p style={{ textAlign: 'center', color: '#9B8B84', fontSize: 13, marginBottom: 16 }}>
        Исполнилось: {fulfilled.length} ✨ · Осталось: {items.filter(w => !w.fulfilled).length}
      </p>

      {/* Фильтры */}
      <div style={{ background: 'rgba(235,229,228,0.35)', borderRadius: 16, border: '1px solid rgba(155,139,132,0.25)', padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9B8B84' }}>Категория</div>
          <button onClick={() => { setShowAddCat(v => !v); setNewCatName('') }}
            style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(155,139,132,0.35)', cursor: 'pointer', background: 'transparent', color: '#9B8B84' }}>
            {showAddCat ? '✕ Отмена' : '+ Своя'}
          </button>
        </div>
        {showAddCat && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
              placeholder="Название категории"
              style={{ flex: 1, fontSize: 12, padding: '5px 10px', borderRadius: 12, border: '1px solid rgba(155,139,132,0.4)', background: 'rgba(255,255,255,0.5)', color: '#6E5F5D', outline: 'none' }}
            />
            <button onClick={addCustomCategory}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: '#9B8B84', color: '#fff' }}>
              Добавить
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['Все', ...allCategories]).map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: filterCat === c ? 'none' : '1px solid rgba(155,139,132,0.35)', cursor: 'pointer', background: filterCat === c ? '#9B8B84' : 'transparent', color: filterCat === c ? '#fff' : '#6E5F5D' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: 'rgba(235,229,228,0.35)', borderRadius: 16, border: '1px solid rgba(155,139,132,0.25)', padding: '10px 12px', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#9B8B84', marginBottom: 7 }}>Приоритет</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['Все', 'high', 'medium', 'low'] as const).map(p => (
            <button key={p} onClick={() => setFilterPri(p as any)}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: filterPri === p ? 'none' : '1px solid rgba(155,139,132,0.35)', cursor: 'pointer', background: filterPri === p ? '#9B8B84' : 'transparent', color: filterPri === p ? '#fff' : '#6E5F5D' }}>
              {p === 'Все' ? 'Все' : PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Список */}
      {active.length === 0 && <p style={{ textAlign: 'center', color: '#9B8B84', padding: '32px 0' }}>Добавь своё первое желание 🌟</p>}
      {active.map(w => (
        <div key={w.id} className="book-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
              <span style={{ fontSize: 28 }}>{w.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#6E5F5D' }}>{w.title}</div>
                <div style={{ fontSize: 12, color: '#9B8B84', marginTop: 2 }}>{w.category} · {PRIORITY_LABELS[w.priority]}</div>
                {w.price && <div style={{ fontSize: 12, color: '#9B8B84' }}>💰 {w.price}</div>}
                {w.link && <a href={w.link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#E0BFB6' }}>🔗 Ссылка</a>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(w)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✏️</button>
              <button onClick={() => remove(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9B8B84' }}>×</button>
            </div>
          </div>
          <button onClick={() => fulfill(w.id)}
            style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 10, border: '1px solid rgba(224,191,182,0.5)', background: 'rgba(235,229,228,0.4)', color: '#6E5F5D', cursor: 'pointer', fontSize: 13 }}>
            Исполнилось ✨
          </button>
        </div>
      ))}

      {/* Исполненные */}
      {fulfilled.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setShowFulfilled(v => !v)}
            style={{ background: 'none', border: 'none', color: '#9B8B84', fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
            {showFulfilled ? '▼' : '▶'} Исполненные ({fulfilled.length})
          </button>
          {showFulfilled && fulfilled.map(w => (
            <div key={w.id} className="book-card" style={{ marginBottom: 8, opacity: 0.6 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>{w.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#6E5F5D', textDecoration: 'line-through' }}>{w.title}</div>
                  <div style={{ fontSize: 12, color: '#9B8B84' }}>✨ Исполнилось</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Форма */}
      {showForm && (
        <div className="books-form" style={{ marginTop: 16 }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', color: '#6E5F5D', marginBottom: 12 }}>{editId ? 'Редактировать' : 'Новое желание'}</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {WISH_EMOJIS.map(e => (
              <button key={e} onClick={() => setFEmoji(e)}
                style={{ fontSize: 22, background: fEmoji === e ? 'rgba(224,191,182,0.4)' : 'transparent', border: fEmoji === e ? '2px solid #E0BFB6' : '2px solid transparent', borderRadius: 10, padding: 4, cursor: 'pointer' }}>
                {e}
              </button>
            ))}
          </div>
          <input className="books-field" placeholder="Название *" value={fTitle} onChange={e => setFTitle(e.target.value)} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
            {allCategories.map(c => (
              <button key={c} onClick={() => setFCat(c)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', background: fCat === c ? '#9B8B84' : 'rgba(235,229,228,0.6)', color: fCat === c ? '#fff' : '#6E5F5D' }}>
                {c}
              </button>
            ))}
            {showAddCat ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', width: '100%', marginTop: 6 }}>
                <input className="books-field" placeholder="Название категории" value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
                  style={{ flex: 1, marginBottom: 0 }} />
                <button onClick={addCustomCategory}
                  style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: '#9B8B84', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                  ОК
                </button>
                <button onClick={() => { setShowAddCat(false); setNewCatName('') }}
                  style={{ padding: '6px 10px', borderRadius: 16, border: 'none', background: 'rgba(235,229,228,0.6)', color: '#6E5F5D', cursor: 'pointer', fontSize: 12 }}>
                  ✕
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAddCat(true)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px dashed #9B8B84', background: 'transparent', color: '#9B8B84', cursor: 'pointer' }}>
                + Своя
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['high', 'medium', 'low'] as WishPriority[]).map(p => (
              <button key={p} onClick={() => setFPriority(p)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', background: fPriority === p ? '#9B8B84' : 'rgba(235,229,228,0.6)', color: fPriority === p ? '#fff' : '#6E5F5D' }}>
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
          <input className="books-field" placeholder="Цена (необязательно)" value={fPrice} onChange={e => setFPrice(e.target.value)} />
          <input className="books-field" placeholder="Ссылка (необязательно)" value={fLink} onChange={e => setFLink(e.target.value)} />
          <div className="books-form-actions">
            <button className="books-cancel-btn" onClick={() => { setShowForm(false); resetForm() }}>Отмена</button>
            <button className="books-save-btn" onClick={save} disabled={!fTitle.trim()}>Сохранить</button>
          </div>
        </div>
      )}

      {!showForm && <button className="books-fab" onClick={openAdd}>+</button>}
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#9B8B84', fontFamily: 'Jost, sans-serif' }}>Загрузка...</p>
    </div>
  )

  if (!user) return <AuthScreen onAuth={setUser} />

  return <MainApp user={user} />
}

function MainApp({ user }: { user: User }) {
  const [search, setSearch] = useState('')
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null)

  const filtered = cards.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="app">
      <div className="container">
        {selectedCard && (
          <div className="bottom-nav">
            <button className="bottom-nav-btn" onClick={() => setSelectedCard(null)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Главная</span>
            </button>
          </div>
        )}
        {selectedCard ? (
          selectedCard.id === 1 ? (
            <TasksScreen key="tasks" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 3 ? (
            <WheelScreen key="wheel" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 9 ? (
            <BooksScreen key="books" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 10 ? (
            <FilmsScreen key="films" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 6 ? (
            <HealthScreen key="health" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 5 ? (
            <FinanceScreen key="finance" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 2 ? (
            <GoalsScreen key="goals" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 13 ? (
            <BirthdayScreen key="birthday" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 12 ? (
            <TrackerScreen key="tracker" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 7 ? (
            <RelationsScreen key="relations" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 8 ? (
            <SelfScreen key="self" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 14 ? (
            <WorkScreen key="work" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 15 ? (
            <StudyScreen key="study" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 16 ? (
            <WishlistScreen key="wishlist" onBack={() => setSelectedCard(null)} />
          ) : selectedCard.id === 17 ? (
            <ChecklistsScreen key="checklists" onBack={() => setSelectedCard(null)} />
          ) : (
            <div className="detail-screen" key={selectedCard.id}>
              {selectedCard.id === 11 ? (
                <ShoppingScreen />
              ) : (
                <div className="detail-content">
                  <div className="detail-icon">{selectedCard.icon}</div>
                  <h1 className="detail-title">{selectedCard.title}</h1>
                  <p className="detail-wip">Раздел в разработке ✨</p>
                </div>
              )}
            </div>
          )
        ) : (
          <div key="home" className="home-screen">
            <header className="header">
              <div className="header-top">
                <div>
                  <p className="date">{today}</p>
                  <h1 className="title">Привет, {user.user_metadata?.name || user.email?.split('@')[0]}! 👋</h1>
                </div>
                <div className="avatar" onClick={() => supabase.auth.signOut()} title="Выйти" style={{ cursor: 'pointer' }}>
                  {(user.user_metadata?.name || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>

              <div className="search-wrap">
                <SearchIcon />
                <input
                  className="search"
                  type="text"
                  placeholder="Поиск разделов..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </header>

            <main className="main">
              <div className="grid">
                {filtered.map(card => (
                  <div
                    key={card.id}
                    className="card"
                    style={{ background: card.bg }}
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="card-icon">{card.icon}</div>
                    <h2 className="card-title">{card.title}</h2>
                    <p className="card-desc">{card.desc}</p>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <p className="empty">Ничего не найдено</p>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
