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
3. קוד באפליקציה: אימות SMS חד-פעמי שמקשר את המנהל לטלפון שלו, ונרמול פורמט הטלפון (owner = בפורמט אחיד מול `request.auth.token.phone_number`).
4. החלפת הכלל של נתוני השטח ל: `allow read, write: if request.auth != null && request.resource.data.owner == ... / resource.data.owner == ...` לפי הטלפון המאומת.

**למה לא דחפתי את קוד ה-Phone Auth כבר:** אי אפשר לבדוק SMS בלי טלפון אמיתי + הפעלת הספק ב-Console, ושינוי נתיב ההתחברות של אפליקציה *חיה* עם מנהלים רשומים מסוכן. נעשה את זה כמו שעשינו את Storage — אתה מפעיל את הספק, ואנחנו בודקים יחד שלב-שלב לפני שזה נכנס לכולם.
