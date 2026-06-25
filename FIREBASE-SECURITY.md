# אבטחת Firebase — דקה (siteboss-b2dd2)

מסמך הפעלה. עודכן 17.06.2026. עוקב אחרי סבב האבטחה (כניסת בעלים ל-admin + תיקון חשיפת הנתונים).

## רקע הבעיה
המסד היה ב-Test Mode / כללים `if request.auth != null` + Auth אנונימי. המשמעות: **כל מי שפותח את האתר (אנונימי) יכול לשלוף את כל מספרי הטלפון של כל המנהלים, לקרוא נתוני כולם, ולשלוח הודעות מזויפות "מהמשרד"**. זו החשיפה הקריטית.

הפתרון בשני שלבים: **B (ביניים — מיידי, בטוח, לא שובר את האפליקציה)** ואז **A (נעילה מלאה לפי בעלים — דורש Phone Auth)**.

---

## שלב 0 — הפעלת כניסת הבעלים ל-admin (חובה, אחרת לא תיכנס ללוח הניהול)
הוספתי ל-`admin.html` מסך כניסה (אימייל+סיסמה). כדי שיעבוד:
1. **Firebase Console → Authentication → Sign-in method → Email/Password → Enable.**
2. **Authentication → Users → Add user** — צור משתמש בעלים אחד (האימייל שלך + סיסמה חזקה). זה החשבון שאיתו תיכנס ללוח הניהול.
3. **העתק את ה-User UID** של המשתמש הזה (טור UID בטבלת Users) — תצטרך אותו בשלב B.

---

## שלב B — כללי ביניים (הדבק עכשיו). בטוח, לא שובר את האפליקציה
חוסם את הנזק הכי גדול: **סקרייפינג של כל הטלפונים** (רשימת מנהלים = בעלים בלבד) ו**התחזות למשרד** (כתיבת הודעות = בעלים בלבד). נתוני השטח נשארים פתוחים-יחסית עד שלב A.

Build → Firestore Database → Rules → הדבק (החלף `OWNER_UID_HERE` ב-UID משלב 0) → Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.uid == 'OWNER_UID_HERE';
    }

    // מנהלים: אפליקציה קוראת/כותבת את הפרופיל שלה; רק הבעלים מקבל את כל הרשימה
    match /managers/{id} {
      allow get:           if request.auth != null;
      allow list:          if isAdmin();              // ← חוסם סקרייפינג המוני
      allow create, update:if request.auth != null;
      allow delete:        if isAdmin();
    }

    // הודעות מהמשרד: מנהלים קוראים; רק הבעלים שולח/עורך
    match /messages/{id} {
      allow read:  if request.auth != null;
      allow write: if isAdmin();                      // ← חוסם התחזות למשרד
    }

    // פניות מהמנהלים: מנהל יוצר; רק הבעלים קורא
    match /feedback/{id} {
      allow create:             if request.auth != null;
      allow read, update, delete: if isAdmin();
    }

    // תדריכים/תוכן מהמשרד: מנהלים קוראים; רק הבעלים כותב
    match /config/{id} {
      allow read:  if request.auth != null;
      allow write: if isAdmin();
    }

    // נתוני שטח (יומן/ליקוי/בטיחות/נוכחות/אירוע/קליטה/היתר) — נשאר auth בלבד עד שלב A
    match /{coll}/{id} {
      allow read, write: if request.auth != null
        && coll in ['journals','defects','safety','presence','incidents','onboard','permits'];
    }
  }
}
```

> ⚠️ חשוב: אל תוסיף כלל "catch-all" פתוח (`match /{document=**}`) לצד הכללים האלה — ב-Firestore גישה ניתנת אם *כל* כלל מתאים מאשר, אז כלל פתוח אחד מבטל את כל ההגבלות. הכללים למעלה כבר מכסים את כל האוספים בשימוש.

אחרי Publish: היכנס ל-admin.html עם חשבון הבעלים — אמור לעבוד כרגיל. נסה לפתוח את admin.html ב**גלישה פרטית בלי להתחבר** — לא אמור לראות מנהלים. וכן: אפליקציית המנהלים ממשיכה לעבוד רגיל.

---

## שלב A — נעילה מלאה לפי בעלים (Phone Auth) — נעשה ביחד, צעד-צעד
זה סוגר גם את נתוני השטח (כל מנהל = רק הנתונים שלו) **וגם** פותר כניסה בין-מכשירית. דורש:
1. Authentication → Sign-in method → **Phone → Enable** (דורש Blaze — כבר יש; SMS עולה ~אגורות לאימות).
2. הוספת הדומיין `arnonyoram-lang.github.io` ל-Authorized domains (בד"כ כבר שם).
3. ✅ **קוד האפליקציה כבר נבנה** (commit `bf121ce`): כפתור "🔒 אבטח את החשבון בקוד SMS" בהגדרות → אימות SMS (RecaptchaVerifier בלתי-נראה). מבודד ובטוח — אם הספק כבוי, מציג "שירות האימות לא הופעל" בלי לשבור כלום.
4. אחרי שתאמת — נחליף את הכלל של נתוני השטח לנעילה-לפי-owner (טיוטה למטה; נסגור יחד את התאמת פורמט הטלפון E164↔digits בבדיקה).

**מה שתעשה (כשנעשה ביחד):** Authentication → Sign-in method → **Phone → Enable**. ודא ש-`arnonyoram-lang.github.io` ב-Authorized domains. ואז נבדוק את זרימת ה-SMS על הטלפון שלך לפני שמחילים את הכלל המחמיר.

**טיוטת כלל נתוני-שטח לפי owner (לשלב A, נסגור יחד):**
```
match /{coll}/{id} {
  allow read, write: if request.auth != null
    && coll in ['journals','defects','safety','presence','incidents','onboard','permits']
    && request.auth.token.phone_number != null
    && request.auth.token.phone_number[ request.auth.token.phone_number.size()-9 : ] ==
       resource.data.owner[ resource.data.owner.size()-9 : ];
}
```
(הרעיון: התאמת 9 הספרות האחרונות של הטלפון המאומת מול owner, ללא תלות בקידומת +972/0. נאמת בבדיקה.)

## ⚠️ סטטוס נכון להיום (בדיקה מקיפה 25.06.2026)
שלב B **פעיל** (טלפונים+הודעות מוגנים). אבל **שלב A טרם בוצע**, ולכן עדיין קיימת החשיפה הקריטית: נתוני השטח בענן (יומנים, ליקויים, נוכחות+GPS, אירועים, פרטי עובדים זרים) **פתוחים לקריאה/כתיבה/מחיקה לכל אנונימי** — האפליקציה מתחברת `signInAnonymously` והכלל בשורה 62 מתיר כל `auth!=null`. **זה חוסם חיבור לקוח אמיתי עם PII.** לסגירה: שלב A (Phone Auth) + החלפת `signInAnonymously`→טלפון בקוד + כללי Storage למטה. נסגור יחד כשתדליק Phone.
> הערה לטיוטת שלב A (שורה 86): ב-`create` אין `resource.data` (רק `request.resource.data`). לפני פרסום נפצל ל-`allow read,update,delete` מול `resource.data.owner` ו-`allow create` מול `request.resource.data.owner` — נסגור יחד בבדיקה.

## כללי Storage (חסרים — להוסיף; אחרת תמונות/חתימות/ת"ז עלולות להיות ציבוריות)
Build → Storage → Rules → הדבק → Publish. כרגע (בלי Phone Auth) לפחות דורש התחברות וחוסם הצגה/כתיבה ציבורית:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{owner}/{allPaths=**} {
      allow read, write: if request.auth != null;   // ביניים: כל מאומת. בשלב A → נצמיד owner לטלפון
    }
    match /{allPaths=**} { allow read, write: if false; }  // חסום כל השאר
  }
}
```
> בשלב A נחליף את שורת ה-photos ל-`request.auth.token.phone_number` שמסתיים ב-9 ספרות של `{owner}` (כמו ב-Firestore), לנעילה אמיתית פר-בעלים.

## חיבור העוזר החכם (Gemini) — קוד מוכן, דורש הפעלה
✅ `runModel` כבר מחובר ל-Firebase AI Logic (commit `f86d5f8`), מבודד ובטוח (fallback ל"לא מחובר" אם כבוי).
**מה שתעשה:** Firebase Console → **Build → AI Logic** (או "Firebase AI Logic"/"Vertex AI in Firebase") → **Get started / Enable**, בחר את **Gemini Developer API**. זהו — העוזר יתחיל לכתוב תשובות אמיתיות. (עלות לפי שימוש; יש Blaze.)
