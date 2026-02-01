// Debug endpoint to check user data in Firebase
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials not configured");
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return getFirestore();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    const db = initFirebaseAdmin();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.json({
        exists: false,
        userId,
        message: "No document found for this user"
      });
    }

    const data = userDoc.data();
    return res.json({
      exists: true,
      userId,
      keys: Object.keys(data || {}),
      hasUserPrototype: !!data?.user?.prototype,
      hasRootPrototype: !!data?.prototype,
      userKeys: data?.user ? Object.keys(data.user) : null,
      // Show archetype to verify prototype exists
      archetypeBlend: data?.user?.prototype?.archetypeBlend || data?.prototype?.archetypeBlend || null
    });
  } catch (error) {
    return res.status(500).json({
      error: "Firebase error",
      message: (error as Error).message
    });
  }
}
