import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import hrFormApi from '../../../services/feedbackmanagement/hrFormApi';

export default function ViewFormResponses() {
  const navigate = useNavigate();
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const formRes = await hrFormApi.getFormById(formId);
        setForm(formRes.data?.data);

        const respRes = await hrFormApi.getResponsesByFormId(formId);
        setResponses(respRes.data?.data || []);
      } catch (err) {
        setError('Failed to load form');
        setForm({
          formId,
          formName: 'Sample Form',
          formDescription: 'Sample Description',
          formType: 'feedback'
        });
        setResponses([
          { responseId: 1, employeeName: 'Employee 1', status: 'Submitted', submittedAt: new Date().toISOString(), answers: '5,4,5,4,5' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [formId]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '1200px' }}>
      <button className="btn btn-outline-secondary mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} className="me-1" />
        Back
      </button>

      {error && (
        <div className="alert alert-warning mb-4">
          <AlertTriangle size={16} className="me-1" />
          {error}
        </div>
      )}

      <h2 className="fw-bold mb-4" style={{ color: 'var(--color-primary-1)' }}>
        {form?.formName}
      </h2>

      <div className="row g-4">
        {responses.map(resp => (
          <div key={resp.responseId} className="col-md-6 col-lg-4">
            <div className="card border-0" style={{ border: '1px solid var(--border)' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h6 className="fw-bold">{resp.employeeName}</h6>
                  <span className="badge bg-success">
                    <CheckCircle size={12} className="me-1" style={{ display: 'inline' }} />
                    Submitted
                  </span>
                </div>

                <small className="text-muted d-block mb-3">
                  Submitted: {new Date(resp.submittedAt).toLocaleDateString()}
                </small>

                <div className="small">
                  <strong>Answers:</strong>
                  <div className="mt-2">
                    {resp.answers ? (
                      resp.answers.split(',').map((ans, idx) => (
                        <div key={idx} className="mb-1">
                          Q{idx + 1}: <span className="badge bg-secondary">{ans} ⭐</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No answers recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
