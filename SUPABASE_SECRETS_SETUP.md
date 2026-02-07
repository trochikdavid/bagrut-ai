# Supabase Edge Functions - הגדרת Secrets

## שלב 1: פריסת Edge Functions

```bash
cd /Users/david/Desktop/bagrut-ai
npx supabase functions deploy openai-scoring
npx supabase functions deploy speech-transcribe
```

## שלב 2: הגדרת Secrets

היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard) → הפרויקט שלך → **Edge Functions** → **Secrets**

הוסף את הסודות הבאים (הערכים נמצאים בקובץ .env המקורי שלך):

### OpenAI
| שם | תיאור |
|----|--------|
| `OPENAI_API_KEY` | המפתח הראשי של OpenAI |
| `OPENAI_TOPIC_DEVELOPMENT_ASSISTANT_ID` | Assistant ID לניקוד Topic Development |
| `OPENAI_TOPIC_DEVELOPMENT_FEEDBACK_ASSISTANT_ID` | Assistant ID לפידבק Topic Development |
| `OPENAI_VOCABULARY_SCORING_ASSISTANT_ID` | Assistant ID לניקוד Vocabulary |
| `OPENAI_VOCABULARY_FEEDBACK_ASSISTANT_ID` | Assistant ID לפידבק Vocabulary |
| `OPENAI_LANGUAGE_SCORING_ASSISTANT_ID` | Assistant ID לניקוד Language |
| `OPENAI_LANGUAGE_FEEDBACK_ASSISTANT_ID` | Assistant ID לפידבק Language |
| `OPENAI_MODULE_C_TOPIC_SCORING_ASSISTANT_ID` | Assistant ID לניקוד Module C |
| `OPENAI_MODULE_C_TOPIC_FEEDBACK_ASSISTANT_ID` | Assistant ID לפידבק Module C |
| `OPENAI_FLUENCY_SCORING_ASSISTANT_ID` | Assistant ID לניקוד Fluency |
| `OPENAI_FLUENCY_FEEDBACK_ASSISTANT_ID` | Assistant ID לפידבק Fluency |

### Azure Speech
| שם | תיאור |
|----|--------|
| `AZURE_SPEECH_KEY` | מפתח Azure Speech Services |
| `AZURE_SPEECH_REGION` | האזור (למשל: eastus) |

## שלב 3: אימות

לאחר פריסת ה-Functions והגדרת ה-Secrets:
1. בדוק שהאפליקציה עובדת כרגיל
2. ודא שה-Console בדפדפן לא מכיל שום API keys
3. בכרטיסיית Network, ודא שאין קריאות ישירות ל-OpenAI/Azure
