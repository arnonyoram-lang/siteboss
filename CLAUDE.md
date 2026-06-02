# דקה — יומן ומשימות שטח (SiteBoss)

מסמך הקשר לשיחות חדשות. קרא אותי בתחילת כל שיחה.

## מה זה
אפליקציית All-in-One למנהלי עבודה בענף הבניין בישראל. RTL, עברית + ערבית, mobile-first.
שם מסחרי: **"דקה"** (לוגו ב-UI). SiteBoss = שם הקוד/הריפו.
משתמש: יורם. בעל הריפו ב-GitHub: `arnonyoram-lang`.

## קבצים
- `siteboss.html` — קובץ המקור (Single Page App: CSS+HTML+JS inline, ~1300 שורות)
- `index.html` — **עותק זהה** ל-siteboss.html. **כלל ברזל: אחרי כל עריכה של siteboss.html יש להעתיק ל-index.html** (`cp siteboss.html index.html`) ואז commit+push לשניהם.
- `admin.html` — עמוד ניהול אדמין נפרד (מוכן Firebase)
- `manifest.json` — PWA
- `.claude/launch.json` — שרת preview (npx serve על פורט 3456)

## אירוח
- GitHub Pages, branch `master`, path `/`.
- אפליקציית המנהלים: https://arnonyoram-lang.github.io/siteboss/
- עמוד ניהול (לבעלים בלבד): https://arnonyoram-lang.github.io/siteboss/admin.html
- כל push ל-master מתעדכן אוטומטית (דקה-שתיים).

## ארכיטקטורת נתונים (חשוב!)
- **כרגע: 100% localStorage, אפס שרת.** כל מכשיר = אי מבודד.
- מפתחות localStorage: `sb_settings`, `sb_journals`, `sb_defects`, `sb_safety`, `dk_journal_serial`, `dk_messages`, `dk_msg_lastread`.
- **תמונות נשמרות base64 ב-localStorage** — סיכון אמיתי: מגבלת ~5MB, ו-`saveJSON` עושה `catch(e){}` ששובל שגיאות → אובדן נתונים שקט. לתקן כשעוברים ל-Firebase Storage.

## מצב Firebase — ✅ מחובר ופועל (siteboss-b2dd2)
- פרויקט: `siteboss-b2dd2`. Web config מוטמע ב-`siteboss.html` (בלוק `FIREBASE_CONFIG` בסוף, script type=module) וב-`admin.html` (`DEFAULT_CONFIG`).
- נבדק חי: רישום מנהל כותב ל-collection `managers` (Write channel 200), וקריאה חזרה עובדת.
- Firestore Database קיים ומופעל (default, europe).
- ⚠️ **אבטחה:** המסד ב-Test Mode (פתוח לקריאה/כתיבה, פג אחרי ~30 יום). לפני משתמשים אמיתיים — להגדיר Security Rules (Build→Firestore→Rules). מודל ללא Auth, אז כללים פתוחים-יחסית או Auth אנונימי.
- ⚠️ עדיין: תמונות base64 ב-localStorage (לא ב-Firebase Storage) — לטפל בהמשך.
- מודל Firestore מוסכם:
  - `managers` (doc id = טלפון מנוקה): name, phone, company, project, lang, registeredAt, lastSeen
  - `messages`: title, body, link, audience ('all' | array of phones), audienceNames, createdAt(serverTimestamp)
- **Firebase הוא תנאי הכרחי** ל: עמוד ניהול, הודעות, ראות הבעלים בנתונים, גיבוי. בלעדיו אלה לא עובדים.

## פיצ'רים שכבר נבנו ונבדקו
1. **3 מודולים**: יומן עבודה (קול→טקסט, כוח אדם, מזג אוויר, תמונות), ליקויים ומשימות (חומרה דחוף/רגיל/נמוך, סטטוס, וואטסאפ לקבלן), בטיחות יומית (5 סוגי עבודה, 12+ שאלות, חתימה, GPS).
2. **דו-לשוני עב/ער** — מתג שפה, כל הטקסט דרך `T(key)` ו-STRINGS.he/STRINGS.ar. סנכרון מלא.
3. **טופס הרשמה** (`s-register`) — שם/טלפון/חברה/פרויקט/שפה. תאימות לאחור (משתמש ישן עם managerName לא יראה הרשמה שוב).
4. **תיקון ליקוי** (defects) — מי תיקן, זמן, מיקום, תמונה, הערות → סטטוס "טופל".
5. **תיקון ליקויי בטיחות** — כפתור "🔧 תוקן" ליד כל ❌ בארכיון בטיחות.
6. **מערכת הודעות מהמשרד** — באנר בבית + מסך `s-messages`. מוכן Firebase (inert עד config).
7. **עמוד ניהול אדמין** (`admin.html`) — רשימת מנהלים, חיפוש, שליחת הודעה (כולם/נבחרים), היסטוריה. מוכן Firebase.
8. **קבילות יומן עבודה** (לפי דרישת קבילות משפטית בישראל):
   - מספר רץ `dk_journal_serial` → "יומן מס׳ 001" (ללא דילוגים)
   - חתימת מנהל עבודה — **חובה, אי אפשר לשמור בלי**
   - אישור פיקוח — כפתור "✍️ אישור פיקוח" בדוח → המפקח חותם בנפרד + חותמת זמן (entry.supervisorApproval)
   - נעילה — יומן read-only, ללא מחיקה/עריכה. ארכיון מציג "⏳ ממתין לאישור" / "✅ מאושר פיקוח".

## מערכת עיצוב (עודכן — מתאים לאנשי שטח)
- פלטה: `--blue:#1c5fb0 --blue-d:#0f3d7a --green:#1f9d57 --orange:#e67e22 --red:#e03131 --accent:#f6a609(ענבר) --bg:#eef2f6 --text:#1b2733 --sub:#67788a`.
- עקרונות: טקסט גדול (בסיס 16px), כפתורים גבוהים (54-56px), ניגודיות גבוהה לשמש, זיהוי לפי אייקון, ענבר=הדגשת "בנייה".
- כפתורי בית: flex עם אייקון ענק (📋 יומן, 📸 ליקויים, 🦺 בטיחות).
- סטטיסטיקות צבועות: יומן כחול, ליקויים כתום, בטיחות ירוק.
- topbar: גרדיאנט כחול + safe-area. admin.html תואם (פס ענבר תחתון, 🦺 בכותרת).
- screen-body padding-bottom כולל env(safe-area-inset-bottom).

## בטיחות — מבנה עדכני (חשוב)
- אין בורר סוג עבודה בראש. מציג **12 שאלות בסיס** תמיד.
- אחרי שאלה 12: כרטיס צ'יפים "➕ שאלות נוספות לשלב שאתה בו עכשיו" — **multi-select** (שלד/גמר/פיגומים/חפירות), כל אחד מוסיף 3 שאלות ייעודיות (מקס 12+12=24, בפועל בוחרים 1-2).
- State: `APP.activeStages` (מערך). פונקציות: `getActiveQs()`, `toggleStage(k)`, `renderSQ(q,num)`, `STAGES`, `SAFETY_EXTRAS`.
- שאלות ייעודיות מודגשות צהוב + תווית "⚠️ ייעודי · [שלב]".
- entry שמור: `stages`(מערך), `stageLabel`(טקסט), `questions`(snapshot), `answers`. showSafetyReport נשען על entry.questions (יש fallback ל-getSafetyQs לתאימות ישנה).

## וואטסאפ
- כל השליחות עוברות דרך `openWhatsApp(phone,text)` יחיד. במובייל: `whatsapp://send` (ישר לאפליקציה, לא טאב דפדפן). בדסקטופ: wa.me ב-_blank. ממיר טלפון אוטומטית לפורמט 972.
- דוח (יומן/בטיחות) כולל כפתור "📲 שלח למשרד" → `shareReportWA()` שבונה מ-`window._currentReport`.

## מלכודות קוד שכבר נתקלנו בהן (להימנע!)
- **אסור nested template literals** (backtick בתוך `${}` בתוך backtick) — שובר את כל ה-JS. להשתמש בשרשור מחרוזות בפונקציות render.
- **אסור onclick עם JSON/עברית inline** — שובר HTML. להעביר ID מספרי ולעשות lookup (ראה showJournalReportById / showSafetyReportById).
- **`::before` של כפתורים צריך `pointer-events:none`** אחרת חוסם קליק.
- כל `T('key')` ו-`data-t="key"` חייבים מפתח גם ב-he וגם ב-ar.
- שמות משתני CSS: `--blue, --blue-d, --green, --orange, --red, --bg, --card, --text, --sub, --border` (אין `--blue-dark`).

## תהליך עבודה
1. ערוך `siteboss.html`. 2. `cp siteboss.html index.html`. 3. בדוק ב-preview (פורט 3456) שאין שגיאות console. 4. commit + push למאסטר. הודעות commit בעברית.

## רעיונות עתידיים שעלו (טרם נבנו)
- הוראות בטיחות בכל השפות (וידאו/אודיו בשפת האם של הפועל הזר + חתימה לפני כניסה לאתר).
- Push notifications אמיתיים (שלב 2 אחרי שיש משתמשים ב-Firebase).
- העברת תמונות מ-base64/localStorage ל-Firebase Storage.

## מודל עסקי שנדון
- ₪49–99/חודש למנהל בודד; ₪199–399 חבילת קבלן/אתר.
- Firebase חינמי עד ~200 מנהלים; ~₪70/חודש ב-1000 מנהלים.
