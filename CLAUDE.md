# SiteBoss — ניהול אתר בנייה

מסמך הקשר לשיחות חדשות. קרא אותי בתחילת כל שיחה.

## מה זה
אפליקציית All-in-One למנהלי עבודה בענף הבניין בישראל. RTL, עברית + ערבית, mobile-first.
שם מסחרי: **SiteBoss** (לוגו ב-UI, בלטינית בשתי השפות; שונה מ"דקה" ב-26.06.2026). טאגליין: "ניהול אתר הבנייה — הכל במקום אחד" / "إدارة موقع البناء — كل شيء في مكان واحد". (השם "דקה" נותר רק בביטוי הערך "דבר דקה אחת" בכפתור היומן — לא מותג.)
משתמש: יורם. בעל הריפו ב-GitHub: `arnonyoram-lang`.

## קבצים
- `siteboss.html` — קובץ המקור (Single Page App: CSS+HTML+JS inline, ~3700 שורות)
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
- **מודול כלים וציוד (#18, יוני 2026):** `s-equipment` (רשימה) + `s-equipment-new` (טופס). מפתח `dk_equipment`, אוסף ענן `equipment`. שדות: `typeKey`/`typeOther` (8 סוגים+אחר), name, operator, photo, ו-3 מסמכים — `toolLicense`/`driverLicense`/`insurance`, כל אחד `*Photo`+`*Exp`. **התראת תפוגה** `eqExpStatus` (expired/soon≤30יום/ok/none) → צ'יפים צבעוניים+פס-צד בכרטיס, `getSmartAlerts` (🚜), תג מונה בבית. fail-loud+`dkOnce`, עריכה/מחיקה, דפדוף 20. פיצ'ר `modEquipment` (def:false; הבעלים מדליק ב-admin `ADV_FEATURES`/preset 'מלא'+'בטיחות'). **`cloudSave` משמיט שדות `photo`/`*Photo`** (מגבלת 1MB) → רק מטא+תאריכים בענן (לא תמונות). **דרוש:** `equipment` נוסף ל-`isFieldColl` ב-`firestore.rules` — צריך re-publish בקונסול לסנכרון ענן (מקומי עובד בלי). OCR לתאריך מצילום — טרם (דורש AI Logic+vision, confirm-not-trust).
- **אדמין בזמן אמת (יוני 2026):** `loadUsers` עבר מ-`getDocs` חד-פעמי ל-`onSnapshot` (`_usersUnsub`) — מנהל שנרשם מופיע מיד בלי רענון.
- **סיכום יום למשרד (יוני 2026):** כפתור `home-digest-btn` בבית (אחרי שורת הסטטיסטיקות) → `sendDailyDigest()` אוסף בלחיצה אחת את נתוני **היום** (נוכחות+מי באתר, יומן עבודה+סה"כ עובדים+עיכובים, בטיחות תקין/מס' ליקויים, ליקויים פתוחים/חדשים-היום/טופלו-היום + פירוט עד 5 דחופים) להודעת וואטסאפ אחת למשרד (`openOfficeWA`). דו-לשוני (ternary inline). guard: יום ריק → toast `digestEmpty`, לא פותח וואטסאפ. severity דחוף=`'urgent'`, זיהוי תיקון-היום=`d.fix.when===today`.
- שיפורי UX (יוני 2026): "המשך מאתמול" ביומן (`copyLastJournal`/`setWorkers`), טיוטה אוטומטית (`saveJnlDraft`), מודל ליקוי עם שדות מקופלים (`setDefMore`) + צ'יפי יעד (`setDeadlineDays`) + שכפול (`duplicateDefect`) + חיוג, ❌ בטיחות פותח מצלמה (answerSQ), תגי ✓/מונה בבית (`setHomeBadge`), מיון כפתורים לפי שימוש (`bumpUsage`/`sortHomeButtons`), צוות-מאתמול בנוכחות (`copyYesterdayCrew`) + שעת כניסה 07:00 + עריכת שעה (`editPresTime`), רטט ב-toast.
- **תמונות base64** — מגבלת localStorage ~5MB. `saveJSON` fail-loud (toast "הזיכרון מלא"). **מאז 19.10.2026 כל התמונות והחתימות בכספת IndexedDB** (עובדים/כלים + רשומות שטח, למטה); ב-localStorage נשארות רק הפניות. מאז 19.10.2026 צילומי יומן/ליקוי/אירוע/תיקון **מוקטנים בצילום** (`dkShrinkPhoto`, למטה).
- **כספת תמונות IndexedDB (`DKV`, 19.10.2026) — תיקון "אי אפשר להוסיף עוד עובדים":** משתמש דיווח שלא מצליח לקלוט עוד עובדים. הסיבה: כל עובד ב-`dk_onboard` נשמר עם 2 צילומי מסמך + חתימה כ-base64 (~100–250K תווים) → אחרי ~20–50 עובדים localStorage מתמלא, `saveJSON` נכשל, והעצה "מחק דוחות ישנים" לא אפשרית (יומנים נעולים). שוחזר בבדיקה עם סימולטור מכסה 5MB: הגרסה הישנה נתקעה בעובד 23/49.
  - הפתרון: מסד IndexedDB `dk_vault` (store `photos`). שדות `photo` / `*Photo` / `signature` של `dk_onboard` ו-`dk_equipment` נשמרים בכספת; ברשומה המקומית נשאר `<שדה>Ref` (מפתח `coll_id_field`).
  - `DKV.cache` טוען את כל הכספת לזיכרון בהפעלה → `getOnboarded()`/`getEquipment()` מחזירים רשומות מלאות (`dkVaultIn`) וההצגה נשארת סינכרונית. שמירה רק דרך `dkSaveVaulted(key,coll,list)` (async; כותב לכספת → `saveJSON` → מנקה מהכספת הפניות שנעלמו). **לא לשמור רשימות אלה ב-`saveJSON` ישירות** — זה יחזיר base64 ל-localStorage.
  - מיגרציה אוטומטית בהפעלה (`dkVaultMigrate` ב-`init`) — משחררת מקום אצל מי שכבר תקוע. כספת לא זמינה → נפילה להתנהגות הישנה (base64 בתוך הרשומה), בלי אובדן.
  - `cloudSave` מחזיר את החתימה לרשומה (`dkVaultIn`) ומשמיט `*Ref` ותמונות. תמונות העובדים/כלים עדיין **לא** עולות ל-Storage (רק מטא+חתימה בענן).
  - נבדק: 48 עובדים תקועים → אחרי עדכון 72K תווים, +300 עובדים (348) בלי שגיאה, ~400 תווים לעובד; כרטיס עובד מציג 3 תמונות אחרי רענון; מחיקה/עריכת כלי מנקים את הכספת.
- **כספת לרשומות שטח (19.10.2026, המשך):** אותה כספת `dk_vault` מכסה עכשיו גם `sb_journals`/`sb_defects`/`sb_safety`/`dk_incidents`/`dk_permits` (`DKV_KEYS`). **שכבה שקופה בתוך `saveJSON`/`loadJSON`** — אין צורך לגעת בקוד המסכים:
  - כל מחרוזת `data:` ≥512 תווים בכל עומק ברשומה (תמונות `photos[]`, `managerSign`, `signature`, `supervisorApproval.sign`, `fix.photo`, `fixes[q].photo`) נשמרת בכספת, ובאחסון המקומי נשאר במקומה `'dkv:<coll>_<id>_<key>'` (`_dkvLean`, replacer של JSON.stringify). `loadJSON` מחזיר רשומה עם הערכים מהמטמון (`_dkvHydrate`, reviver). תוכן היומן הנעול זהה בבייטים — רק מקום האחסון השתנה.
  - **טעינה עצלה:** בהפעלה נטענים למטמון רק `onboard_`/`equipment_` (כמו קודם); תמונות שטח (`DKV_LAZY`) לא — צילומי מצלמה **לא מוקטנים** (3–5MB כל אחד) והיו מפילים את הזיכרון. הפניה שלא במטמון נשארת `'dkv:...'` ברשומה ו**נשמרת כמו שהיא** בכל שמירה (לא נמחקת). הצגה: `dkPhotosOf` / `dkImg(v)` מבקשים טעינה (`_dkvWant`) → `_dkvRerender` מרענן את המסך הפתוח (ליקויים/אירועים/היתרים/דוח). **מסך חדש שמציג תמונה/חתימה של רשומת שטח — חייב לעבור דרך `dkImg`/`dkPhotosOf`.**
  - שמירה (`_dkvSave`): ערכים שכבר בכספת → הפניות (מפה הפוכה ערך→מפתח מהמטמון); תמונה חדשה נכתבת קודם inline (עמיד מיד) ו-`_dkvFlush` ברקע מעביר לכספת ואז מחליף להפניה. לא נכנס (צילום ענק/אחסון מלא) → נכתב לכספת עכשיו והאחסון המקומי מקבל רק הפניות (`DKV.pending`; כשל → ניסיון חוזר + טוסט). `_dkvClean` מוחק מהכספת מפתחות של האוסף שאף רשומה (וגם לא גיבוי `_corrupt`) מפנה אליהם.
  - ענן: `cloudSave` — רשומה עם הפניות עוברת `_dkvFull` (שליפה מהכספת בלי למלא מטמון, עד 3 במקביל `_dkvLimit`) → `_cloudSaveNow` (הגוף הישן). המסמך בענן זהה לקודם; ה-Storage מקבל base64 אמיתי; הפניה שאבדה לא נשלחת (`_dkvNoRefs`, merge שומר ערך קודם).
  - מיגרציה `_dkvMigrate` ב-`DKV.ready` (ליד `dkVaultMigrate`). אין IndexedDB → `saveJSON` הישן (inline), הפניות קיימות נשמרות, תצוגה נופלת ל-`photoUrls`. `_freeSpace` מפנה רק תמונות inline. `_dkTrimPhotos` ממשיך לעבוד (ומנקה גם מהכספת).
  - נבדק עם סימולטור מכסה 5MB על עותק בלי Firebase: ישנה נתקעה ביומן 9 (5.22M תווים) → חדשה: 12K תווים, 0 base64 מקומי, 67 ערכים בכספת, כל 40 הרשומות זהות ב-SHA-256; דוחות יומן (2 תמונות+2 חתימות)/בטיחות/ליקויים/אירועים/היתרים מוצגים; יומן חדש דרך המסך, ליקוי עם צילום 2.5MB, אירוע עם 6.8M תווים (יותר מכל המכסה) — נשמרו; אישור פיקוח על יומן ישן (שאר השדות זהים), תיקון ליקוי/בטיחות עם תמונה, מחיקת ליקוי מנקה כספת; cloudSave מדומה — upload זהה למקור, אין `dkv:` במסמך; גיבוי-לאחור 43 רשומות במקסימום 3 במקביל; בלי IndexedDB — התנהגות ישנה, 18 הפניות שרדו; CSV תקין.
- **הקטנת צילומי תיעוד (19.10.2026, המשך 2):** `handleJnlPhotos`/`handleDefectPhotos`/`handleIncPhotos` עוברים דרך `dkAddPhoto(getList,raw,render)`, ו-`handleFixPhoto`/`handleSafetyFixPhoto` דרך `dkShrinkPhoto`. צד ארוך `DK_PHOTO_MAX=1600`, JPEG `DK_PHOTO_Q=0.75` (~300KB), תור סדרתי (`_dkShrinkQ`) — לא מפענחים כמה צילומי ענק במקביל. מוחלף רק אם קטן יותר; תמונה ≤1600px וקטנה מ-600K תווים נשארת כמו שהיא; פורמט שלא מפוענח (HEIC באנדרואיד) נשאר מקורי.
  - **EXIF נשמר** (`_dkKeepExif`): מקטע APP1 מהמקור מועתק אחרי ה-JFIF של התוצאה, ו-Orientation מאופס ל-1 (הדפדפן כבר מיישר בציור). תומך II ו-MM. תאריך/שעת צילום, מיקום ומכשיר נשמרים כראיה.
  - **בטוח לשמירה מהירה:** הצילום המקורי נכנס לרשימה מיד, וההקטנה מחליפה אותו רק אם הוא עדיין שם (`indexOf`/`_fixPhoto===raw`). יומן שנשמר לפני סיום ההקטנה נשאר עם המקור — לא משתנה אחר כך.
  - עובדים/כלים — ללא שינוי (`dkCompressImage`, 1000px/0.6). רשומות קיימות לא נגעו.
  - נבדק (עותק בלי Firebase): "צילום מצלמה" 4000×3000 עם EXIF סיבוב 6 → 1200×1600 ישר, 5.4MB→327KB, ~0.4 שניות, EXIF תאריך+מכשיר נשמרו; יומן/ליקוי (MM)/אירוע (2 יחד)/תיקון ליקוי/תיקון בטיחות; שמירה לפני ההקטנה → המקור נשמר; קטנה/HEIC → ללא שינוי; אפס שגיאות.
- **צילומי ❌ בבדיקת בטיחות נשמרים (19.10.2026, המשך 3):** עד עכשיו `APP.safetyPhotos` נאסף ונזרק. היום: `renderSQ` מציג תמונה ממוזערת + ✕ (`removeSQPhoto`) + "החלף תמונה"; `handleSQPhoto` מקטין (`dkShrinkPhoto`, בטוח לשמירה מהירה). `confirmSafety` שומר רק לשאלות שעדיין ❌ — **`entry.photos[i]` שייך ל-`entry.photoKeys[i]`** (שדות נוספים רק כשיש תמונות). כך הם עוברים במסלול הרגיל של `photos` בלי קוד נוסף: כספת, `cloudSave` (המסמך בלי photos, עם photoKeys; העלאה ל-`photos/<owner>/safety/<id>/i.jpg` — מותר ב-storage.rules), `photoUrls`, `_dkTrimPhotos`/`_freeSpace`. בדוח: `sqPhotoOf(entry,qKey)` — מקומי דרך `dkImg`, ואם נוקה → `photoUrls[i]` (רק כשהאורכים מיושרים). `admin.html`: כרטיס בטיחות מציג `photos(r)`. נבדק: 2 צילומים, אחד הוחזר ל-✅ → נשמר רק הראשון; דוח אחרי רענון; ענן מדומה; נוקה→ענן; דוח ישן; ✕.
- **תדריך בטיחות בכרטיס עובד (20.10.2026):** דיווח ממחמוד "לא נפתח תדריך" (עובד תאילנדי). `viewOnboard` הציג רק "שפה: X" בלי הטקסט. עכשיו: `obBriefText(lang)` (מותאם מהמשרד `dk_briefings` או `SAFETY_BRIEF`) + `obBriefHtml(lang,txt)` (כותרת שפה + טקסט `dir="auto"` — שפות LTR נקראות נכון) משמשים גם את מסך הקליטה וגם את הכרטיס. `saveOnboard` שומר **`brief`** = הנוסח המדויק שהעובד ראה וחתם עליו (תיעוד); כרטיס של עובד ישן בלי `brief` מציג את הנוסח הנוכחי + הערה (`obBriefSigned`/`obBriefCurrent`, he+ar). הכרטיס מוצג לכל עובד עם `lang` (גם ישראלי — עברית).
- **הדרכת בטיחות מקיפה ב-8 שפות (20.10.2026):** `SAFETY_BRIEF` הוחלף ב-15 סעיפים (מערך שורות שמחוברות ב-join לכל שפה) + שורת חתימה ✍️ בשפת העובד. מקורות: עברית/סינית — מסמכי PDF של יורם (בסינית תוקנו: סעיף 7 סולם "请务必使用梯子进行工作"→"禁止站在梯子上进行作业", כלי תקול "返厂"→"交到仓库", שריפה "移除已起火材料"→"移开易燃材料", קשירת רתמה); הינדית — PDF הודי (23 כללי + 5 חשמל, נקטע ב"מכונות") + נושאי העברית שחסרו (גובה, סולם, חמה, חפירות, אחר); ar/ru/am/th/tr — תרגום שלי מהעברית (לבקש בדיקת דובר לאמהרית/תאית). נוסח מותאם מהמשרד (`config/briefings` באדמין) **גובר** על ברירת המחדל.
  - **אחסון:** הדרכה = 1.3–5K תווים. `saveOnboard` לא שומר יותר את הטקסט בכל עובד — `obBriefKeep(txt)` שומר פעם אחת ב-`dk_briefs` {מזהה-לפי-תוכן: טקסט} ובעובד רק `briefId` (fallback ל-`brief` אם נכשל). `viewOnboard`: `brief` (רשומות 20.10 בוקר) / `obBriefById(briefId)` / נוסח נוכחי. `_cloudSaveNow` מוסיף לעובד בענן `brief` מלא. נבדק: 8 שפות דרך מסך הקליטה, 3 תאילנדים → נוסח אחד, רשומת עובד ~300 תווים, נוסח משרד חדש → מזהה חדש והישן נשמר, ענן מדומה, מחיקה, רוחב 375px בלי גלישה, עובדים קיימים.

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
- **אבטחה (יוני 2026) — ✅ פעיל:** ראה `FIREBASE-SECURITY.md`. admin.html מאחורי כניסת בעלים (Email/Password — `ensureAdminLogin`) — **הופעל בקונסול + נוצר משתמש בעלים**. כללי Firestore שלב B **פורסמו וחיים**: רשימת מנהלים+כתיבת הודעות+פניות+תדריכים = בעלים בלבד (לפי UID), נתוני שטח = auth. נבדק חי: בעלים נכנס ורואה נתונים, אפליקציה שומרת רגיל. כל רשומת ענן נושאת `owner`=טלפון מנוקה (ב-`cloudSave`).
- **שלב A (Phone Auth, נעילה לפי owner על נתוני שטח) — טרם בוצע** (שדרוג עתידי, collaborative).

## פיצ'רים שכבר נבנו ונבדקו
1. **3 מודולים**: יומן עבודה (תיאור טקסט, כוח אדם, מזג אוויר, תמונות; **הקלטת קול הוסרה 29.06.2026 — לא עבדה טוב, אולי בעתיד**), ליקויים ומשימות (חומרה דחוף/רגיל/נמוך, סטטוס, וואטסאפ לקבלן), בטיחות יומית (5 סוגי עבודה, 12+ שאלות, חתימה, GPS).
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
- ✅ admin.html יושר ל-Hi-Tech (אותם טוקנים, Heebo, topbar נייבי, בלי גרדיאנטים, מסך כניסה באקסנט).

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
- **המודל מחובר ופועל חי (28-29.06.2026):** `runModel`→`window._dkRunModel` (אינסטנס AI מבודד `dkAI`, lazy). **תוקן:** הגרסה הייתה `11.3.0` שבה `firebase-ai.js` לא קיים → הייבוא נכשל תמיד ("לא מחובר") → שונה ל-**`11.10.0`**. ה-backend שונה מ-`GoogleAIBackend` (Gemini Developer API — דרש קרדיט מראש, 429 בישראל) ל-**`VertexAIBackend`** (חיוב דרך Blaze). הדגם שונה מ-`gemini-2.0-flash` (404 לא זמין ב-Vertex) ל-**`gemini-2.5-flash`**. יורם הפעיל Vertex AI API בקונסול. נבדק חי: תשובה אמיתית מלאה. fallback בטוח ל"לא מחובר" אם נכשל.
- **התראות תפוגה דו-שלביות (29.06.2026):** `expStage`/`expDaysLeft`/`expAlert` — לכל תאריך סיום: 🔔 חודש לפני, ⚠️ "תזכורת שנייה...טרם טופל" ב≤14 יום, 🔴 פג. חל ב-`getSmartAlerts` על כלים (3 תאריכים), אישור-גובה בקליטת עובד (`heightExp`), והיתרי עבודה (`validUntil`). poll-based (מופיע בתזכורות+תג בית בכניסה לאפליקציה — לא push אמיתי). `eqExpStatus` מאציל ל-`expStage`.
- **Phone Auth (אופציונלי, מבודד)**: כפתור בהגדרות `openPhoneSecure` → `_dkSendSmsCode`/`_dkVerifySmsCode` (RecaptchaVerifier בלתי-נראה). דורש הפעלת Phone provider. graceful אם כבוי.
- **ייצוא CSV**: `dkExportCSV('defects'|'journals')` — BOM לאקסל-עברית. **ניקוי base64**: `_dkTrimPhotos` (שומר 15 אחרונות, מסיר ישנות שכבר בענן).

## רעיונות עתידיים שעלו (טרם נבנו)
- הוראות בטיחות בכל השפות (וידאו/אודיו בשפת האם של הפועל הזר + חתימה לפני כניסה לאתר).
- Push notifications אמיתיים (שלב 2 אחרי שיש משתמשים ב-Firebase).
- העברת תמונות מ-base64/localStorage ל-Firebase Storage.

## מודל עסקי שנדון
- ₪49–99/חודש למנהל בודד; ₪199–399 חבילת קבלן/אתר.
- Firebase חינמי עד ~200 מנהלים; ~₪70/חודש ב-1000 מנהלים.
