// src/hooks/useFeedbackService.js
import { useCallback, useState } from 'react';
import { managerReviewApi, mentorFeedbackApi, peerQueueApi, hrFormApi, orgGoalFeedbackApi } from '../services/feedbackApi';

export default function useFeedbackService() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Loads
  const loadEmployee = useCallback(async (empId, opts = {}) => {
    setError(null); setLoading(true);
    try {
      const [reviews, mentor, activeForms] = await Promise.all([
        managerReviewApi.getForTarget(empId),
        mentorFeedbackApi.myFeedback(empId),
        hrFormApi.listActive()
      ]);
      return {
        reviews: reviews.data?.data || [],
        mentor: mentor.data?.data || [],
        forms: activeForms.data?.data || []
      };
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Load failed');
      return { reviews: [], mentor: [], forms: [] };
    } finally { setLoading(false); }
  }, []);

  const loadManager = useCallback(async (managerId) => {
    setError(null); setLoading(true);
    try {
      const res = await managerReviewApi.getByManager(managerId);
      return { myReviews: res.data?.data || [] };
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Load failed');
      return { myReviews: [] };
    } finally { setLoading(false); }
  }, []);

  const loadHR = useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const [pendingPeer, pendingForms] = await Promise.all([
        peerQueueApi.pending(),
        hrFormApi.pendingReview()
      ]);
      return {
        pendingPeer: pendingPeer.data?.data || [],
        pendingForms: pendingForms.data?.data || []
      };
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Load failed');
      return { pendingPeer: [], pendingForms: [] };
    } finally { setLoading(false); }
  }, []);

  const loadSME = useCallback(async (mentorId) => {
    setError(null); setLoading(true);
    try {
      const res = await mentorFeedbackApi.aboutMe(mentorId);
      return { aboutMe: res.data?.data || [] };
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Load failed');
      return { aboutMe: [] };
    } finally { setLoading(false); }
  }, []);

  // Actions
  const actions = {
    // Manager
    submitReview: (id) => managerReviewApi.submit(id),
    modifyReview: (id) => managerReviewApi.modify(id),
    finalizeReview: (id) => managerReviewApi.finalize(id),
    updateReview: (id, body) => managerReviewApi.update(id, body),

    // Mentor/SMM
    createMentorFeedback: (body) => mentorFeedbackApi.create(body),
    acknowledgeMentor: (id) => mentorFeedbackApi.acknowledge(id),

    // HR
    approvePeer: (id, payload) => peerQueueApi.approve(id, payload),
    rejectPeer: (id, payload) => peerQueueApi.reject(id, payload),
    hrSetReview: (id, payload) => hrFormApi.hrReview(id, payload),

    // Forms
    createForm: (body) => hrFormApi.createForm(body),
    createFormResponse: (body) => hrFormApi.createResponse(body),
    submitFormResponse: (id) => hrFormApi.submitResponse(id),
  };

  return { loading, error, setError, loadEmployee, loadManager, loadHR, loadSME, actions };
}
