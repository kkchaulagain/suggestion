const base = process.env.VITE_API_URL ?? 'http://localhost:3001';

export const userapi = `${base}/api/auth/register`;
export const loginapi = `${base}/api/auth/login`;
export const meapi = `${base}/api/auth/me`;
export const businessmeapi = `${base}/api/auth/business`;
export const feedbackFormsApi = `${base}/api/feedback-forms`;
export const feedbackFormSubmissionsApi = `${base}/api/feedback-forms/submissions`;
export const uploadApi = `${base}/api/upload`;
export const businessesListApi = `${base}/api/v1/business`;
export const usersApi = `${base}/api/users`;
