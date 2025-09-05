import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: "production",
      version: "3.0.0-prototype",
      message: "TrustDiner Prototype API is running (Pages Router)",
      prototype_mode: true
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
