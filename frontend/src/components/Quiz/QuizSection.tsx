import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Typography, Space, Tag, Spin, Row, Col, Modal, App, Progress } from 'antd';
import { TrophyOutlined, ClockCircleOutlined, PlayCircleOutlined, DownloadOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
// @ts-ignore
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { getMyResults, answerQuiz } from '../../api/quizzes';
import { useAuthStore } from '../../store/authStore';
import type { Quiz } from '../../types';
import { Leaf, LeafOutline } from '../Decor/Leaf';

const { Title, Text, Paragraph } = Typography;

interface Props {
  quizzes: Quiz[];
  topicId: string;
  examStarted?: boolean;
  setExamStarted?: (started: boolean) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ===== INLINE FILE VIEWER =====
const FileViewer: React.FC<{ url: string; fileType: string; title: string }> = ({ url, fileType, title }) => {
  const isPdf = fileType === 'pdf';
  const isWord = fileType === 'docx' || fileType === 'doc';
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [loadingWord, setLoadingWord] = useState(false);
  const [wordError, setWordError] = useState<string | null>(null);

  useEffect(() => {
    if (isWord && url) {
      setLoadingWord(true);
      setWordError(null);
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error('Faylni yuklab olishda xatolik');
          return r.arrayBuffer();
        })
        .then((buf) => mammoth.convertToHtml({ arrayBuffer: buf }))
        .then((result) => {
          // XSS himoyasi: hujjat ichidan kelishi mumkin bo'lgan skript/hodisalar tozalanadi
          setWordHtml(DOMPurify.sanitize(result.value));
        })
        .catch((err) => {
          console.error('Mammoth error:', err);
          setWordError("Word hujjatini sayt ichida ko'rsatishda xatolik yuz berdi. Pastdagi tugma orqali yuklab olishingiz mumkin.");
        })
        .finally(() => {
          setLoadingWord(false);
        });
    }
  }, [url, isWord]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .mammoth-test-content p {
          margin-bottom: 1em;
          line-height: 1.7;
          color: var(--ink);
          font-size: 15px;
        }
        .mammoth-test-content h1,
        .mammoth-test-content h2,
        .mammoth-test-content h3 {
          margin-top: 1.2em;
          margin-bottom: 0.6em;
          font-weight: bold;
          color: var(--ink);
        }
        .mammoth-test-content table {
          width: 100% !important;
          max-width: 100%;
          table-layout: fixed; /* keng jadval siqilib sig'adi — gorizontal scroll chiqmaydi */
          border-collapse: collapse;
          margin-bottom: 1.2em;
        }
        .mammoth-test-content th,
        .mammoth-test-content td {
          border: 1px solid var(--line);
          padding: 8px;
          word-break: break-word;
        }
        .mammoth-test-content img {
          max-width: 100% !important;
          height: auto !important;
        }
      `}</style>

      {isPdf && (
        <iframe
          src={url}
          title={title}
          style={{
            width: '100%',
            height: 'calc(100vh - 240px)',
            minHeight: '600px',
            border: '1px solid var(--line)',
            borderRadius: 12,
            background: 'var(--surface)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          }}
        />
      )}

      {isWord && (
        <>
          {loadingWord && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 'calc(100vh - 240px)',
              minHeight: '600px',
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 12
            }}>
              <Spin tip="Word hujjati o'qilmoqda..." />
            </div>
          )}
          {wordError && (
            <div style={{
              padding: 16,
              background: '#fdf3f2',
              border: '1px dashed #f0b4b0',
              borderRadius: 12,
              textAlign: 'center',
              marginBottom: 12
            }}>
              <Text type="danger">{wordError}</Text>
            </div>
          )}
          {wordHtml && (
            <div
              style={{
                width: '100%',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                padding: 24,
                overflowWrap: 'anywhere', /* hujjat to'liq bo'yiga ochiladi, ichki scroll yo'q */
              }}
              className="mammoth-test-content"
              dangerouslySetInnerHTML={{ __html: wordHtml }}
            />
          )}
        </>
      )}

      {!isPdf && !isWord && (
        <div style={{
          height: 'calc(100vh - 240px)',
          minHeight: '600px',
          background: 'var(--bg)',
          border: '1px dashed var(--line)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center'
        }}>
          <Text type="secondary" style={{ marginBottom: 12 }}>Ushbu faylni brauzerda onlayn ko'rib bo'lmaydi.</Text>
          <Button href={url} target="_blank" icon={<DownloadOutlined />}>Faylni yuklab olish</Button>
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
        <Button size="small" type="link" icon={<DownloadOutlined />} href={url} target="_blank">
          Faylni alohida oynada ochish / yuklab olish
        </Button>
      </div>
    </div>
  );
};

const QuizSection: React.FC<Props> = ({
  quizzes = [],
  topicId,
  examStarted: propsExamStarted,
  setExamStarted: propsSetExamStarted,
}) => {
  const { user, updatePoints } = useAuthStore();
  const { message } = App.useApp();

  const [localExamStarted, setLocalExamStarted] = useState(false);
  const examStarted = propsExamStarted !== undefined ? propsExamStarted : localExamStarted;

  const setExamStarted = (val: boolean) => {
    if (propsSetExamStarted !== undefined) propsSetExamStarted(val);
    else setLocalExamStarted(val);
  };

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const queryClient = useQueryClient();

  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalData, setResultModalData] = useState<any>(null);

  const { data: myResults = [], isLoading } = useQuery({
    queryKey: ['quiz-results', topicId],
    queryFn: () => getMyResults(topicId),
    enabled: !!user,
  });

  const { mutate: submitTest, isPending } = useMutation({
    mutationFn: (userAnswers: Record<string, string>) => answerQuiz(activeQuiz!.id, userAnswers),
    onSuccess: (data) => {
      if (timerRef.current) clearInterval(timerRef.current);
      queryClient.invalidateQueries({ queryKey: ['quiz-results', topicId] });
      // Navbar balli va reyting serverdan yangilanadi
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      if (!data.alreadyAnswered && data.earnedPoints > 0 && user) updatePoints(user.points + data.earnedPoints);
      setResultModalData(data);
      setResultModalOpen(true);
      setExamStarted(false);
      if (data.alreadyAnswered) {
        message.info('Siz bu testni avval topshirgansiz — oldingi natijangiz ko\'rsatilmoqda.');
      } else {
        message.success(`Test topshirildi! Siz ${Math.round(data.score)}% to'g'ri javob berdingiz va +${data.earnedPoints} ball oldingiz!`);
      }
    },
    onError: () => message.error('Javoblarni yuborishda xato yuz berdi'),
  });

  // Himoya: exam rejimi yoqilgan-u, activeQuiz yo'q bo'lsa (kutilmagan holat),
  // sahifa qulamasligi uchun exam rejimini o'chiramiz
  useEffect(() => {
    if (examStarted && !activeQuiz) setExamStarted(false);
  }, [examStarted, activeQuiz]);

  useEffect(() => {
    if (examStarted && activeQuiz && activeQuiz.timeLimit > 0) {
      setTimeLeft(activeQuiz.timeLimit * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            submitTest(answersRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [examStarted, activeQuiz?.id]);

  if (isLoading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

  const handleStartExam = (quiz: Quiz) => {
    if (!user) { message.warning('Testni boshlash uchun iltimos tizimga kiring!'); return; }
    setActiveQuiz(quiz);
    setAnswers({});
    setExamStarted(true);
  };

  const handleSelectOption = (num: number, opt: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      if (copy[String(num)] === opt) {
        delete copy[String(num)];
      } else {
        copy[String(num)] = opt;
      }
      return copy;
    });
  };

  const handleSubmit = () => {
    const unanswered = Array.from({ length: activeQuiz!.questionCount }, (_, i) => i + 1).filter(n => !answers[String(n)]);
    if (unanswered.length > 0) {
      Modal.confirm({
        title: 'Diqqat',
        content: `Siz hali ${unanswered.length} ta savolga javob bermadingiz (Savollar: ${unanswered.join(', ')}). Shunga qaramay testni yakunlamoqchimisiz?`,
        okText: 'Ha, yakunlash',
        cancelText: 'Ortga',
        onOk() { submitTest(answers); },
      });
    } else {
      Modal.confirm({
        title: 'Testni yakunlash',
        content: 'Barcha savollarga javob berib bo\'ldingiz. Testni topshirishni tasdiqlaysizmi?',
        okText: 'Ha, topshirish',
        cancelText: 'Ortga',
        onOk() { submitTest(answers); },
      });
    }
  };

  // Scroll helper inside test interface
  const scrollToQuestion = (num: number) => {
    const el = document.getElementById(`q-row-${num}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Qisqa vizual urg'u — keyin inline stil tozalanadi, class stillari buzilmaydi
      el.style.boxShadow = '0 0 0 2px var(--accent)';
      setTimeout(() => { el.style.boxShadow = ''; }, 1000);
    }
  };

  if (!examStarted) {
    return (
      <div style={{ marginTop: 12 }}>
        <style>{`
          .quiz-card-premium {
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 24px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 250px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
            overflow: hidden;
          }
          .quiz-card-premium::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--accent-soft) 0%, var(--accent) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .quiz-card-premium:hover {
            border-color: var(--accent-soft);
            transform: translateY(-5px);
            box-shadow: 0 12px 28px rgba(27, 138, 78, 0.06);
          }
          .quiz-card-premium:hover::before {
            opacity: 1;
          }
          .stat-badge-premium {
            background: var(--bg);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13.5px;
            color: var(--ink);
            font-weight: 500;
          }
          .stat-badge-premium svg {
            color: var(--accent);
            font-size: 15px;
          }
          .option-circle-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1.5px solid var(--line);
            background: var(--surface);
            color: var(--ink);
            font-weight: 600;
            font-size: 14.5px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            outline: none;
            user-select: none;
          }
          .option-circle-btn:hover {
            border-color: var(--accent);
            background: var(--accent-soft);
            color: var(--accent-ink);
            transform: scale(1.05);
          }
          .option-circle-btn:active {
            transform: scale(0.95);
          }
          .option-circle-btn.selected {
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
            border-color: var(--accent-deep);
            color: #fff;
            box-shadow: 0 4px 12px rgba(27, 138, 78, 0.3);
          }
          .nav-dot {
            width: 34px;
            height: 34px;
            border-radius: 8px;
            border: 1px solid var(--line);
            background: var(--surface);
            color: var(--ink);
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .nav-dot:hover {
            border-color: var(--accent);
            background: var(--accent-soft);
            color: var(--accent-ink);
            transform: scale(1.05);
          }
          .nav-dot.answered {
            background: var(--accent-soft);
            border-color: var(--accent);
            color: var(--accent-ink);
          }
          .nav-dot.current {
            border-color: var(--accent-deep);
            box-shadow: 0 0 0 2px var(--accent-soft);
          }
          .questions-list-scroll {
            max-height: calc(100vh - 380px);
            min-height: 400px;
            overflow-y: auto;
            padding-right: 8px;
            margin-top: 14px;
          }
          .questions-list-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .questions-list-scroll::-webkit-scrollbar-track {
            background: var(--bg);
            border-radius: 10px;
          }
          .questions-list-scroll::-webkit-scrollbar-thumb {
            background: var(--line);
            border-radius: 10px;
          }
          .questions-list-scroll::-webkit-scrollbar-thumb:hover {
            background: var(--muted);
          }
          .question-row-premium {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 18px;
            background: var(--surface);
            border: 1px solid var(--line);
            border-radius: 14px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
          }
          .question-row-premium:hover {
            border-color: var(--accent-soft);
            background: var(--bg);
          }
          .timer-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
            transition: all 0.3s ease;
          }
          .timer-normal {
            background: var(--accent-soft);
            color: var(--accent-ink);
            border: 1px solid var(--accent-soft);
          }
          .timer-warning {
            background: #fffbe6;
            color: #d46b08;
            border: 1px solid #ffe58f;
            animation: pulse 1s infinite alternate;
          }
          .timer-danger {
            background: #fff1f0;
            color: #cf1322;
            border: 1px solid #ffa39e;
            animation: pulse-danger 0.8s infinite alternate;
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            100% { transform: scale(1.03); }
          }
          @keyframes pulse-danger {
            0% { transform: scale(1); box-shadow: 0 0 0 0px rgba(207, 19, 34, 0.2); }
            100% { transform: scale(1.05); box-shadow: 0 0 0 4px rgba(207, 19, 34, 0.1); }
          }
        `}</style>

        {quizzes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '56px 20px',
            border: '1px dashed var(--line)',
            borderRadius: 20,
            background: 'var(--surface)',
          }}>
            <LeafOutline size={48} color="var(--muted)" style={{ opacity: 0.5, marginBottom: 16 }} />
            <p style={{ color: 'var(--muted)', fontSize: 15, margin: 0 }}>Hozircha ushbu mavzu uchun testlar qo'shilmagan.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {quizzes.map((quiz, index) => {
              const myResult = myResults.find(r => r.quizId === quiz.id);
              const score = myResult ? Math.round(myResult.score) : null;
              return (
                <div key={quiz.id} className="quiz-card-premium">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Leaf size={16} color="var(--accent)" />
                        <Text strong style={{ fontSize: 17, color: 'var(--ink)' }}>Test #{index + 1}</Text>
                      </span>
                      {myResult ? (
                        <Tag color="success" style={{ borderRadius: 8, padding: '2px 8px', fontWeight: 600 }}>✓ Topshirilgan</Tag>
                      ) : (
                        <Tag color="processing" style={{ borderRadius: 8, padding: '2px 8px', fontWeight: 600 }}>Faol</Tag>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                      <div className="stat-badge-premium">
                        <FileTextOutlined />
                        <span>Savollar soni: <strong>{quiz.questionCount} ta</strong></span>
                      </div>
                      <div className="stat-badge-premium">
                        <ClockCircleOutlined />
                        <span>Vaqt cheklovi: <strong>{quiz.timeLimit > 0 ? `${quiz.timeLimit} daqiqa` : 'Cheklanmagan'}</strong></span>
                      </div>
                    </div>

                    {/* Show user result details directly in card */}
                    {myResult && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        background: 'var(--bg)',
                        border: '1px solid var(--line)',
                        borderRadius: 14,
                        padding: '12px 16px',
                        marginBottom: 16
                      }}>
                        <Progress
                          type="circle"
                          percent={score || 0}
                          width={52}
                          strokeWidth={8}
                          strokeColor="var(--accent)"
                        />
                        <div>
                          <Text style={{ display: 'block', fontSize: 12.5, color: 'var(--muted)', lineHeight: '1.2' }}>To'g'ri javoblar:</Text>
                          <Text strong style={{ fontSize: 14, color: 'var(--ink)' }}>{myResult.correctCount} / {myResult.totalCount}</Text>
                          <div style={{ marginTop: 2 }}>
                            <Tag color="green" style={{ border: 'none', fontWeight: 700, padding: '0 6px', fontSize: 11 }}>+{myResult.earnedPoints} ball</Tag>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!myResult && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <Button
                        type="primary"
                        block
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartExam(quiz)}
                        style={{ height: 42, borderRadius: 12 }}
                      >
                        Testni boshlash
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Modal open={resultModalOpen} onCancel={() => setResultModalOpen(false)} footer={null} centered width={420}>
          {resultModalData && (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                marginBottom: 16
              }}>
                <TrophyOutlined />
              </div>
              <Title level={3} style={{ color: 'var(--ink)', margin: '0 0 8px 0' }}>Sizning Natijangiz</Title>
              <Paragraph type="secondary" style={{ marginBottom: 24 }}>Test muvaffaqiyatli yakunlandi va tizimda saqlandi.</Paragraph>
              
              <Progress
                type="circle"
                percent={Math.round(resultModalData.score)}
                strokeWidth={10}
                strokeColor="var(--accent)"
                width={120}
                style={{ marginBottom: 24 }}
              />

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: '16px 20px',
                textAlign: 'left'
              }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>To'g'ri javoblar</Text>
                  <Text strong style={{ fontSize: 16, color: 'var(--ink)' }}>{resultModalData.correctCount} / {resultModalData.totalCount}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>Kiritilgan ball</Text>
                  <Text strong style={{ fontSize: 16, color: 'var(--accent)' }}>+{resultModalData.earnedPoints} ball</Text>
                </div>
              </div>

              <Button type="primary" block size="large" style={{ marginTop: 24, borderRadius: 12 }} onClick={() => setResultModalOpen(false)}>
                Tushunarli
              </Button>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  if (!activeQuiz) {
    return <Spin style={{ display: 'block', margin: '40px auto' }} />;
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / activeQuiz!.questionCount) * 100);

  // Determine timer color class
  let timerClass = 'timer-normal';
  if (activeQuiz!.timeLimit > 0) {
    if (timeLeft <= 60) timerClass = 'timer-danger';
    else if (timeLeft <= 180) timerClass = 'timer-warning';
  }

  return (
    <div style={{ marginTop: 12 }}>
      <style>{`
        .option-circle-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid var(--line);
          background: var(--surface);
          color: var(--ink);
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        .option-circle-btn:hover {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent-ink);
        }
        .option-circle-btn.selected {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
          border-color: var(--accent-deep);
          color: #fff;
          box-shadow: 0 4px 10px rgba(27, 138, 78, 0.25);
        }
        .nav-dot {
          width: 100%;
          height: 30px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--ink);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .nav-dot:hover {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent-ink);
        }
        .nav-dot.answered {
          background: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent-ink);
        }
        .questions-list-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding-right: 6px;
          margin-top: 12px;
        }
        .questions-list-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .questions-list-scroll::-webkit-scrollbar-track {
          background: var(--bg);
          border-radius: 10px;
        }
        .questions-list-scroll::-webkit-scrollbar-thumb {
          background: var(--line);
          border-radius: 10px;
        }
        .questions-list-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--muted);
        }
        .question-row-premium {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 12px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 10px;
          margin-bottom: 8px;
          transition: all 0.2s ease;
        }
        .question-row-premium:hover {
          border-color: var(--accent-soft);
          background: var(--bg);
        }
        .question-row-premium.answered {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .timer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .timer-normal {
          background: var(--accent-soft);
          color: var(--accent-ink);
          border: 1px solid var(--accent-soft);
        }
        .timer-warning {
          background: #fffbe6;
          color: #d46b08;
          border: 1px solid #ffe58f;
          animation: pulse 1s infinite alternate;
        }
        .timer-danger {
          background: #fff1f0;
          color: #cf1322;
          border: 1px solid #ffa39e;
          animation: pulse-danger 0.8s infinite alternate;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          100% { transform: scale(1.03); }
        }
        @keyframes pulse-danger {
          0% { transform: scale(1); box-shadow: 0 0 0 0px rgba(207, 19, 34, 0.2); }
          100% { transform: scale(1.05); box-shadow: 0 0 0 4px rgba(207, 19, 34, 0.1); }
        }
      `}</style>

      <Row gutter={[24, 24]}>
        {/* Left Side: Test questions preview */}
        <Col xs={24} md={15}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            height: '100%'
          }}>
            <FileViewer url={activeQuiz!.fileUrl || ''} fileType={activeQuiz!.fileType || ''} title="Test Materiali" />
          </div>
        </Col>

        {/* Right Side: Answer entry cards sheet */}
        <Col xs={24} md={9}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: 16,
            position: 'sticky',
            top: 80,
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            /* panel ekranga sig'adi: savollar ro'yxati ichkarida scroll bo'ladi,
               sarlavha, progress va "Yakunlash" tugmasi doim ko'rinib turadi */
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 96px)',
          }}>
            {/* Header with timer and title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
              <Text strong style={{ fontSize: 16, color: 'var(--ink)' }}>Javoblar varaqasi</Text>
              {activeQuiz!.timeLimit > 0 ? (
                <div className={`timer-badge ${timerClass}`}>
                  <ClockCircleOutlined />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              ) : (
                <Tag color="default" style={{ borderRadius: 10, padding: '4px 10px', fontWeight: 600 }}>Vaqt cheklanmagan</Tag>
              )}
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 12, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <Text type="secondary">Belgilandi:</Text>
                <Text strong style={{ color: 'var(--accent-ink)' }}>{answeredCount} / {activeQuiz!.questionCount}</Text>
              </div>
              <Progress percent={progressPercent} strokeColor="var(--accent)" trailColor="var(--line)" showInfo={false} size="small" />
            </div>

            {/* Quick navigation grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
              gap: 5,
              maxHeight: 78,
              overflowY: 'auto',
              border: '1px solid var(--line)',
              borderRadius: 8,
              background: 'var(--bg)',
              padding: 8,
              flexShrink: 0,
            }}>
              {Array.from({ length: activeQuiz!.questionCount }, (_, i) => i + 1).map(num => {
                const isAnswered = !!answers[String(num)];
                return (
                  <div
                    key={num}
                    onClick={() => scrollToQuestion(num)}
                    className={`nav-dot ${isAnswered ? 'answered' : ''}`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>

            {/* Scrollable list of questions */}
            <div className="questions-list-scroll">
              {Array.from({ length: activeQuiz!.questionCount }, (_, i) => i + 1).map(num => {
                const isRowAnswered = !!answers[String(num)];
                return (
                  <div key={num} id={`q-row-${num}`} className={`question-row-premium ${isRowAnswered ? 'answered' : ''}`}>
                    <Text strong style={{ fontSize: 14, color: 'var(--ink)', flexShrink: 0 }}>{num < 10 ? `0${num}` : num}-savol</Text>
                    <Space size={5}>
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const isSelected = answers[String(num)] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectOption(num, opt)}
                            className={`option-circle-btn ${isSelected ? 'selected' : ''}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </Space>
                  </div>
                );
              })}
            </div>

            {/* Submit button */}
            <Button
              type="primary"
              block
              size="large"
              icon={<CheckCircleOutlined />}
              style={{ marginTop: 12, height: 46, borderRadius: 12, fontSize: 15, flexShrink: 0 }}
              onClick={handleSubmit}
              loading={isPending}
            >
              Testni yakunlash
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default QuizSection;
