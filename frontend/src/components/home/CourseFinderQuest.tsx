'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Heart,
  RotateCcw,
  Shield,
  Star,
  Target,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useT } from '@/i18n/MarketingI18nProvider'
import { localizedHref } from '@/i18n/href'
import styles from './CourseFinderQuest.module.css'

type CourseId = 'arabic' | 'quran' | 'tajweed' | 'islam'
type Phase = 'courses' | 'questions' | 'result'

interface Question {
  prompt: string
  options: string[]
}

interface CourseCopy {
  name: string
  description: string
  programTag: string
  resultTitle: string
  resultPack: string
  resultDescription: string
  skills: [string, string, string]
  href: string
  questions: [Question, Question, Question]
}

interface QuestCopy {
  eyebrow: string
  title: string
  progress: string
  intro: string
  start: string
  mission: string
  back: string
  question: string
  result: string
  level: string
  bookTrial: string
  viewProgram: string
  restart: string
  lives: string
  statusCourse: string
  statusQuestion: string
  statusResult: string
  courses: Record<CourseId, CourseCopy>
}

const COPY: Record<'en' | 'fr', QuestCopy> = {
  en: {
    eyebrow: 'Mini orientation game',
    title: 'Which course is right for me?',
    progress: 'Progress',
    intro: 'Choose your quest. The game then adapts the questions to estimate your current level.',
    start: 'Start',
    mission: 'Level mission',
    back: 'Go back',
    question: 'Question {current}/3',
    result: 'Result',
    level: 'Level {level}',
    bookTrial: 'Book a free trial',
    viewProgram: 'View the program',
    restart: 'Restart the orientation game',
    lives: 'Three lives remaining',
    statusCourse: 'Choose a course to begin.',
    statusQuestion: 'Question {current} of 3.',
    statusResult: 'Your recommendation is ready.',
    courses: {
      arabic: {
        name: 'Arabic',
        description: 'Letters, reading, vocabulary, and conversation.',
        programTag: 'Arabic for Non-Arabs',
        resultTitle: 'Arabic Foundations',
        resultPack: 'Practical Arabic Pack',
        resultDescription: 'Build confident reading and useful vocabulary through guided, one-to-one practice.',
        skills: ['Reading', 'Vocabulary', 'Speaking'],
        href: '/courses/arabic-for-non-arabs',
        questions: [
          {
            prompt: 'How comfortable are you with the Arabic alphabet today?',
            options: [
              'I do not recognize the letters yet',
              'I recognize some letters with help',
              'I can join letters and read slowly',
              'I read Arabic words with ease',
            ],
          },
          {
            prompt: 'How much everyday Arabic do you understand?',
            options: [
              'Almost none yet',
              'A few familiar words',
              'Simple phrases and questions',
              'Everyday conversations',
            ],
          },
          {
            prompt: 'What would you most like to improve first?',
            options: [
              'Letters and pronunciation',
              'Reading simple words',
              'Vocabulary and sentences',
              'Fluent conversation',
            ],
          },
        ],
      },
      quran: {
        name: 'Quran',
        description: 'Reading, memorization, and confidence with the Mushaf.',
        programTag: 'Quran Classes for Kids',
        resultTitle: 'Reading Level',
        resultPack: 'Quran Reading Pack',
        resultDescription: 'Read short surahs with more confidence, accuracy, and less hesitation.',
        skills: ['Guided reading', 'Correction', 'Consistency'],
        href: '/courses/quran-classes-for-kids',
        questions: [
          {
            prompt: 'Today, how do you read the Quran?',
            options: [
              'I do not read Arabic yet',
              'I read with a lot of help',
              'I read alone, but slowly',
              'I read with ease',
            ],
          },
          {
            prompt: 'How confidently do you recognize Quranic words?',
            options: [
              'I am just beginning',
              'I recognize letters and short words',
              'I read verses with some pauses',
              'I read pages smoothly',
            ],
          },
          {
            prompt: 'What is your main Quran goal right now?',
            options: [
              'Start from the alphabet',
              'Read short surahs correctly',
              'Improve fluency and accuracy',
              'Memorize with strong revision',
            ],
          },
        ],
      },
      tajweed: {
        name: 'Tajweed',
        description: 'Makharij, characteristics, and recitation rules.',
        programTag: 'Tajweed Course',
        resultTitle: 'Recitation Level',
        resultPack: 'Tajweed Confidence Pack',
        resultDescription: 'Strengthen pronunciation and apply Tajweed rules naturally while reciting.',
        skills: ['Makharij', 'Rules', 'Fluency'],
        href: '/courses/tajweed-course',
        questions: [
          {
            prompt: 'How familiar are you with Tajweed rules?',
            options: [
              'I have not studied them yet',
              'I know a few rule names',
              'I apply common rules with help',
              'I apply most rules independently',
            ],
          },
          {
            prompt: 'How confident are you with Arabic letter articulation?',
            options: [
              'I need to learn each sound',
              'Some letters are still difficult',
              'Most letters are clear',
              'My makharij are consistent',
            ],
          },
          {
            prompt: 'What happens when you recite a new passage?',
            options: [
              'I need the teacher to model each word',
              'I need regular correction',
              'I make a few rule mistakes',
              'I recite accurately and fluently',
            ],
          },
        ],
      },
      islam: {
        name: 'Islam',
        description: 'Aqidah, manners, stories, and practical foundations.',
        programTag: 'Islamic Studies',
        resultTitle: 'Knowledge Level',
        resultPack: 'Islamic Foundations Pack',
        resultDescription: 'Grow sound Islamic knowledge through clear lessons, stories, and practical guidance.',
        skills: ['Aqidah', 'Manners', 'Practice'],
        href: '/courses/islamic-studies',
        questions: [
          {
            prompt: 'How would you describe your Islamic studies background?',
            options: [
              'I am completely new',
              'I know a few basics',
              'I have studied several topics',
              'I study regularly and want depth',
            ],
          },
          {
            prompt: 'How confidently can you explain the pillars of Islam?',
            options: [
              'I am still learning them',
              'I can name some of them',
              'I know them and their meaning',
              'I can explain and apply them',
            ],
          },
          {
            prompt: 'Which learning style helps you most?',
            options: [
              'Simple stories and examples',
              'Short guided lessons',
              'Discussion and reflection',
              'Detailed study with evidence',
            ],
          },
        ],
      },
    },
  },
  fr: {
    eyebrow: 'Mini-jeu d’orientation',
    title: 'Quel cours est fait pour moi ?',
    progress: 'Progression',
    intro: 'Je choisis ma quête. Le jeu adapte ensuite les questions pour estimer mon niveau actuel.',
    start: 'Start',
    mission: 'Mission niveau',
    back: 'Revenir en arrière',
    question: 'Question {current}/3',
    result: 'Résultat',
    level: 'Niveau {level}',
    bookTrial: 'Réserver le cours d’essai',
    viewProgram: 'Voir le programme',
    restart: 'Recommencer le jeu d’orientation',
    lives: 'Trois vies restantes',
    statusCourse: 'Choisissez un cours pour commencer.',
    statusQuestion: 'Question {current} sur 3.',
    statusResult: 'Votre recommandation est prête.',
    courses: {
      arabic: {
        name: 'Arabe',
        description: 'Lettres, lecture, vocabulaire et conversation.',
        programTag: 'Arabe pour non-arabophones',
        resultTitle: 'Niveau Arabe',
        resultPack: 'Pack Arabe pratique',
        resultDescription: 'Développez une lecture confiante et un vocabulaire utile grâce à un accompagnement individuel.',
        skills: ['Lecture', 'Vocabulaire', 'Expression'],
        href: '/courses/arabic-for-non-arabs',
        questions: [
          {
            prompt: 'Aujourd’hui, comment reconnaissez-vous l’alphabet arabe ?',
            options: [
              'Je ne reconnais pas encore les lettres',
              'Je reconnais quelques lettres avec de l’aide',
              'Je relie les lettres et je lis lentement',
              'Je lis les mots arabes avec aisance',
            ],
          },
          {
            prompt: 'Quelle quantité d’arabe courant comprenez-vous ?',
            options: [
              'Presque rien pour le moment',
              'Quelques mots familiers',
              'Des phrases et questions simples',
              'Des conversations du quotidien',
            ],
          },
          {
            prompt: 'Que souhaitez-vous améliorer en premier ?',
            options: [
              'Les lettres et la prononciation',
              'La lecture de mots simples',
              'Le vocabulaire et les phrases',
              'La conversation fluide',
            ],
          },
        ],
      },
      quran: {
        name: 'Coran',
        description: 'Lecture, mémorisation et confiance avec le mushaf.',
        programTag: 'Cours de Coran pour Enfants',
        resultTitle: 'Niveau Lecture',
        resultPack: 'Pack Lecture du Coran',
        resultDescription: 'Pour lire les sourates courtes avec plus d’assurance et moins d’hésitation.',
        skills: ['Lecture guidée', 'Correction', 'Régularité'],
        href: '/courses/quran-classes-for-kids',
        questions: [
          {
            prompt: 'Aujourd’hui, comment est-ce que je lis le Coran ?',
            options: [
              'Je ne lis pas encore l’arabe',
              'Je lis avec beaucoup d’aide',
              'Je lis seul mais lentement',
              'Je lis avec aisance',
            ],
          },
          {
            prompt: 'Avec quelle confiance reconnaissez-vous les mots du Coran ?',
            options: [
              'Je commence tout juste',
              'Je reconnais les lettres et les mots courts',
              'Je lis les versets avec quelques pauses',
              'Je lis les pages avec fluidité',
            ],
          },
          {
            prompt: 'Quel est votre objectif principal avec le Coran ?',
            options: [
              'Commencer par l’alphabet',
              'Lire correctement les sourates courtes',
              'Améliorer la fluidité et la précision',
              'Mémoriser avec une révision solide',
            ],
          },
        ],
      },
      tajweed: {
        name: 'Tajwid',
        description: 'Makharij, sifaat et règles de récitation.',
        programTag: 'Cours de Tajwid',
        resultTitle: 'Niveau Récitation',
        resultPack: 'Pack Confiance Tajwid',
        resultDescription: 'Renforcez votre prononciation et appliquez naturellement les règles pendant la récitation.',
        skills: ['Makharij', 'Règles', 'Fluidité'],
        href: '/courses/tajweed-course',
        questions: [
          {
            prompt: 'Connaissez-vous les règles du Tajwid ?',
            options: [
              'Je ne les ai pas encore étudiées',
              'Je connais le nom de quelques règles',
              'J’applique les règles courantes avec de l’aide',
              'J’applique seul la plupart des règles',
            ],
          },
          {
            prompt: 'Êtes-vous à l’aise avec l’articulation des lettres arabes ?',
            options: [
              'Je dois apprendre chaque son',
              'Certaines lettres restent difficiles',
              'La plupart des lettres sont claires',
              'Mes makharij sont réguliers',
            ],
          },
          {
            prompt: 'Que se passe-t-il lorsque vous récitez un nouveau passage ?',
            options: [
              'Le professeur doit montrer chaque mot',
              'J’ai besoin de corrections régulières',
              'Je fais quelques erreurs de règles',
              'Je récite avec précision et fluidité',
            ],
          },
        ],
      },
      islam: {
        name: 'Islam',
        description: 'Aqidah, adab, histoires et bases pratiques.',
        programTag: 'Sciences islamiques',
        resultTitle: 'Niveau Connaissances',
        resultPack: 'Pack Fondements islamiques',
        resultDescription: 'Développez des connaissances islamiques solides avec des leçons claires et des conseils pratiques.',
        skills: ['Aqidah', 'Adab', 'Pratique'],
        href: '/courses/islamic-studies',
        questions: [
          {
            prompt: 'Comment décririez-vous votre parcours en sciences islamiques ?',
            options: [
              'Je débute complètement',
              'Je connais quelques bases',
              'J’ai étudié plusieurs sujets',
              'J’étudie régulièrement et je veux approfondir',
            ],
          },
          {
            prompt: 'Pouvez-vous expliquer les piliers de l’Islam ?',
            options: [
              'Je suis encore en train de les apprendre',
              'Je peux en nommer quelques-uns',
              'Je les connais et comprends leur sens',
              'Je peux les expliquer et les appliquer',
            ],
          },
          {
            prompt: 'Quelle méthode d’apprentissage vous aide le plus ?',
            options: [
              'Des histoires et exemples simples',
              'De courtes leçons guidées',
              'La discussion et la réflexion',
              'Une étude détaillée avec les preuves',
            ],
          },
        ],
      },
    },
  },
}

const COURSE_IDS: CourseId[] = ['arabic', 'quran', 'tajweed', 'islam']

const COURSE_ICONS: Record<CourseId, LucideIcon> = {
  arabic: BookOpen,
  quran: Star,
  tajweed: Zap,
  islam: Shield,
}

const COURSE_COLORS: Record<CourseId, string> = {
  arabic: '#31b6b1',
  quran: '#e5b725',
  tajweed: '#2d80ec',
  islam: '#8950ee',
}

function interpolate(value: string, variables: Record<string, number>) {
  return value.replace(/\{(\w+)\}/g, (_, key) => String(variables[key] ?? `{${key}}`))
}

export function CourseFinderQuest() {
  const { locale } = useT()
  const copy = COPY[locale]
  const [phase, setPhase] = useState<Phase>('courses')
  const [courseId, setCourseId] = useState<CourseId | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [scores, setScores] = useState<number[]>([])

  const course = courseId ? copy.courses[courseId] : null
  const progress = phase === 'courses' ? 14 : phase === 'result' ? 100 : 25 + questionIndex * 25
  const level = useMemo(() => {
    const total = scores.reduce((sum, score) => sum + score, 0)
    if (total <= 2) return 1
    if (total <= 6) return 2
    return 3
  }, [scores])

  useEffect(() => {
    if (selectedOption === null || phase !== 'questions') return

    const timer = window.setTimeout(() => {
      setScores((current) => [...current, selectedOption])
      setSelectedOption(null)
      if (questionIndex === 2) {
        setPhase('result')
      } else {
        setQuestionIndex((current) => current + 1)
      }
    }, 430)

    return () => window.clearTimeout(timer)
  }, [phase, questionIndex, selectedOption])

  function startCourse(nextCourse: CourseId) {
    setCourseId(nextCourse)
    setQuestionIndex(0)
    setSelectedOption(null)
    setScores([])
    setPhase('questions')
  }

  function goBack() {
    if (selectedOption !== null) return
    if (questionIndex === 0) {
      setCourseId(null)
      setScores([])
      setPhase('courses')
      return
    }

    setQuestionIndex((current) => current - 1)
    setScores((current) => current.slice(0, -1))
  }

  function restart() {
    setPhase('courses')
    setCourseId(null)
    setQuestionIndex(0)
    setSelectedOption(null)
    setScores([])
  }

  const liveStatus =
    phase === 'courses'
      ? copy.statusCourse
      : phase === 'result'
        ? copy.statusResult
        : interpolate(copy.statusQuestion, { current: questionIndex + 1 })

  return (
    <section id="course-finder" className={styles.section} aria-labelledby="course-finder-heading">
      <div className={styles.layout}>
        <div className={styles.mascotColumn} aria-hidden="true">
          <div className={styles.mascotGlow} />
          <Image
            src="/images/course-finder-mascot.webp"
            width={1254}
            height={1254}
            alt=""
            className={styles.mascot}
            sizes="(max-width: 820px) 88vw, 470px"
          />
          <span className={styles.missionBadge}>
            <Target className={styles.missionTarget} size={16} />
            {copy.mission}
          </span>
        </div>

        <div className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>{copy.eyebrow}</p>
              <h2 id="course-finder-heading" className={styles.title}>
                {copy.title}
              </h2>
            </div>
            <div className={styles.lives} role="img" aria-label={copy.lives}>
              {[0, 1, 2].map((heart) => (
                <Heart key={heart} size={17} fill="currentColor" aria-hidden="true" />
              ))}
            </div>
          </header>

          <div className={styles.progressBlock}>
            <div className={styles.progressMeta}>
              <span>{copy.progress}</span>
              <span>{progress}%</span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label={copy.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {liveStatus}
          </p>

          {phase === 'courses' && (
            <>
              <p className={styles.intro}>{copy.intro}</p>
              <div className={styles.courseGrid}>
                {COURSE_IDS.map((id) => {
                  const item = copy.courses[id]
                  const Icon = COURSE_ICONS[id]
                  return (
                    <button
                      key={id}
                      type="button"
                      className={styles.courseCard}
                      onClick={() => startCourse(id)}
                      aria-label={`${copy.start}: ${item.name}`}
                    >
                      <span className={styles.courseIcon} style={{ backgroundColor: COURSE_COLORS[id] }}>
                        <Icon size={23} aria-hidden="true" />
                      </span>
                      <span className={styles.courseStart}>{copy.start}</span>
                      <span className={styles.courseName}>{item.name}</span>
                      <span className={styles.courseDescription}>{item.description}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {phase === 'questions' && course && (
            <>
              <div className={styles.questionMeta}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={goBack}
                  aria-label={copy.back}
                  title={copy.back}
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                </button>
                <span className={styles.metaPill}>{course.programTag}</span>
                <span className={`${styles.metaPill} ${styles.questionPill}`}>
                  {interpolate(copy.question, { current: questionIndex + 1 })}
                </span>
              </div>

              <h3 className={styles.questionTitle}>{course.questions[questionIndex].prompt}</h3>
              <div className={styles.answers}>
                {course.questions[questionIndex].options.map((option, index) => {
                  const isSelected = selectedOption === index
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.answer} ${isSelected ? styles.answerSelected : ''}`}
                      onClick={() => setSelectedOption(index)}
                      disabled={selectedOption !== null}
                      aria-pressed={isSelected}
                    >
                      <span className={styles.answerText}>{option}</span>
                      {isSelected && (
                        <CheckCircle2 className={styles.answerCheck} size={20} aria-hidden="true" />
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {phase === 'result' && course && (
            <>
              <div className={styles.resultCard}>
                <div className={styles.resultTopline}>
                  <span className={styles.resultLabel}>{copy.result}</span>
                  <span className={styles.levelBadge}>
                    <Star size={13} fill="currentColor" aria-hidden="true" />
                    {interpolate(copy.level, { level })}
                  </span>
                </div>
                <h3 className={styles.resultTitle}>{course.resultTitle}</h3>
                <p className={styles.resultPack}>{course.resultPack}</p>
                <p className={styles.resultDescription}>{course.resultDescription}</p>
              </div>

              <div className={styles.skillGrid}>
                {course.skills.map((skill) => (
                  <span key={skill} className={styles.skill}>
                    {skill}
                  </span>
                ))}
              </div>

              <div className={styles.actions}>
                <Link className={styles.primaryCta} href={localizedHref('/contact', locale)}>
                  {copy.bookTrial}
                </Link>
                <Link className={styles.secondaryCta} href={localizedHref(course.href, locale)}>
                  {copy.viewProgram}
                </Link>
                <button
                  type="button"
                  className={styles.restartButton}
                  onClick={restart}
                  aria-label={copy.restart}
                  title={copy.restart}
                >
                  <RotateCcw size={21} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
