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
- מפתחות localStorage: `sb_settings`, `sb_journals`, `sb_defects`, `sb_safety`, `dk_journal_serial`, `dk_messages`, `dk_msg_lastread`, `dk_jnl_draft` (טיוטת יומן יומית), `dk_usage` (מונה שימוש למיון כפתורי בית), `pres_YYYY-MM-DD`, `dk_reminders`, `dk_permits`, `dk_incidents`, `dk_onboard`, `dk_features`, `dk_user_prefs`, `dk_sync_queue` (תור רשומות שנשמרו בלי קליטה→נשלח כשחוזרת רשת), `dk_onboard_tip` (טיפ ראשון הוצג).
- **סבב QA+שיפורים (יוני 2026):** fail-loud בכל 8 מודולי השמירה (לא ✅ כוזב בזיכרון מלא, `saveFailFull`); נרמול טלפון בהרשמה (ספרות, מינ' 9); `photoUrls` נשמר מקומית כך ש-`_freeSpace` לא משבית צפייה (`dkPhotosOf`); דפדוף (`APP.defPage/jnlPage/sfPage/incPage`, 20/עמוד) + חיפוש חופשי בליקויים (`setDefSearch`); תור-סנכרון (`_dkEnqueueSync`/`_dkFlushSync`) + חיווי לא-מקוון (`dkOfflineWatch`); מסך תנאי/פרטיות (`s-legal`/`renderLegal`); טיפ ראשון (`maybeShowOnboardTip`); ניגודיות+focus+aria. ייצוא PDF=הדפסה. נבדק: כל 19 המסכים, דו-לשוניות 0-empty, אפס שגיאות.
- שיפורי UX (יוני 2026): "המשך מאתמול" ביומן (`copyLastJournal`/`setWorkers`), טיוטה אוטומטית (`saveJnlDraft`), מודל ליקוי עם שדות מקופלים (`setDefMore`) + צ'יפי יעד (`setDeadlineDays`) + שכפול (`duplicateDefect`) + חיוג, ❌ בטיחות פותח מצלמה (answerSQ), תגי ✓/מונה בבית (`setHomeBadge`), מיון כפתורים לפי שימוש (`bumpUsage`/`sortHomeButtons`), צוות-מאתמול בנוכחות (`copyYesterdayCrew`) + שעת כניסה 07:00 + עריכת שעה (`editPresTime`), רטט ב-toast.
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
- **אבטחה (יוני 2026):** ראה `FIREBASE-SECURITY.md`. admin.html מאחורי כניסת בעלים (Email/Password — `ensureAdminLogin`). כללי Firestore שלב B (ביניים) מוכנים להדבקה: רשימת מנהלים+כתיבת הודעות = בעלים בלבד (UID), נתוני שטח = auth. שלב A (Phone Auth, נעילה לפי owner) — collaborative, טרם בוצע. כל רשומת ענן כבר נושאת `owner`=טלפון מנוקה (ב-`cloudSave`).

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

## מערכת עיצוב — Hi-Tech v0.3 (מקור-אמת: `DESIGN.md`)
- **הוחלפה ל-Hi-Tech (יוני 2026):** מינימליזם, לבן נקי, דיו נייבי, אקסנט חשמלי יחיד. בלי גרדיאנטים, צללים מינימליים, כרטיסים על surface-container במקום צל.
- טוקנים (ב-`:root`): `--navy:#0A1A2F` (דיו) · `--accent:#6161FF` (היחיד — CTA/קישורים/מיקוד) · `--surface:#FFFFFF` · `--container:#F4F6FA` (כרטיסים) · `--sub:#5C6B82` · `--border:#E2E7F0`. **תאימות-לאחור:** השמות הישנים (`--blue`→accent, `--card`→container, `--bg`→surface, `--text`→navy) מופו לערכים החדשים כך שכל הקוד עובד.
- גופן: **Heebo** (גוף, עברית-first) + **Space Grotesk** (כותרות/מספרים), נטענים מ-Google Fonts.
- כפתורי בית: כרטיס container, דיו נייבי, אריח אייקון באקסנט (`!important` דורס את הגרדיאנטים ה-inline הישנים). **זיהוי מודול לפי אימוג'י, לא לפי צבע מלא.**
- צבעי סטטוס (אדום/כתום/ירוק) נשמרו **לבטיחות/חומרת-ליקוי בלבד** — מאופקים, מינימליים.
- topbar: נייבי מלא (בלי גרדיאנט). radii: 8px כפתורים/שדות, 12px כרטיסים. נגישות: מיקוד אקסנט + halo, ניגודיות WCAG מאומתת.
- כפתורים גבוהים (54px) נשמרו לשטח. screen-body padding-bottom כולל env(safe-area-inset-bottom).
- ⚠️ admin.html עדיין בעיצוב הישן — לעדכן ל-Hi-Tech בנפרד אם רוצים אחידות.

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

## עוזר חכם (שכבת מומחי-AI) — שלב 1 בנוי
- מקור-אמת מיובא מ"עוזר מנהל" (`lib/skills.ts`+`lib/experts.ts`). מסך `s-expert`, כפתור בית `home-mod-expert`.
- 9 מומחים (`DK_SKILLS`): documents(כולל SOP), risk, summary(כולל meeting→actions), premortem, decision, contract, negotiation, hr(כולל hiring-kit), collection.
- ניתוב לפי כוונה: `pickExpertDK(text)` (ניקוד מילות-מפתח, מילה שלמה×3). צ'יפים לבחירה ידנית (`expChip`).
- הזרקת הקשר אתר: `dkBusinessContext()` (חברה/פרויקט/מנהל/ליקויים פתוחים) → `dkBuildSystemPrompt(exp)`.
- **המודל עדיין לא מחובר**: `runModel(systemPrompt,userText)` מחזיר `Promise.resolve(null)` → המסך מציג שזיהה את המומחה ובנה הנחיה מלאה. זו נקודת החיבור היחידה — למלא בה Firebase AI Logic (Gemini) כשנחבר. נבדק: ניתוב 10/10 כוונות נכון, הזרקת הקשר, צ'אט.

## רעיונות עתידיים שעלו (טרם נבנו)
- הוראות בטיחות בכל השפות (וידאו/אודיו בשפת האם של הפועל הזר + חתימה לפני כניסה לאתר).
- Push notifications אמיתיים (שלב 2 אחרי שיש משתמשים ב-Firebase).
- העברת תמונות מ-base64/localStorage ל-Firebase Storage.

## מודל עסקי שנדון
- ₪49–99/חודש למנהל בודד; ₪199–399 חבילת קבלן/אתר.
- Firebase חינמי עד ~200 מנהלים; ~₪70/חודש ב-1000 מנהלים.
