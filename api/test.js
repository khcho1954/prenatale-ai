// 최소한의 테스트 엔드포인트
module.exports = async function handler(req, res) {
  console.log('Test endpoint called:', req.method, req.url);
  
  // 기본 응답
  res.status(200).json({
    status: 'working',
    message: 'Vercel serverless function is operational',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL
    }
  });
};