import React from "react";
import { PaginationDropdown } from "./ManagerDashboardUtils";

export default function AssessmentsTable({
  data,
  isCompleted,
  currentPage,
  totalPages,
  perPage,
  totalItems,
  onPageChange,
  setPerPage,
  setPage,
  setCurrentAssignment,
  setModalMode,
  setAssessmentData,
  setShowModal,
  handleViewCompleted,
}) {
  return (
    <>
      <div className="manevap-table-container">
        <table className="manevap-table">
          <thead>
            <tr>
              <th>
                <i className="bi bi-file-earmark-text"></i> Form Name
              </th>
              <th>
                <i className="bi bi-tag"></i> Type
              </th>
              <th>
                <i className="bi bi-calendar-check"></i> Assigned
              </th>
              <th>
                <i className="bi bi-calendar-x"></i> Deadline
              </th>
              <th>
                <i className="bi bi-gear"></i> Action
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((assignment) => (
              <tr key={assignment.assignmentId}>
                <td>
                  <strong>{assignment.formName}</strong>
                </td>
                <td>
                  <span
                    className={`manevap-badge ${
                      isCompleted ? "success" : "info"
                    }`}
                  >
                    <i
                      className={`bi ${
                        isCompleted
                          ? "bi-check-circle-fill"
                          : "bi-bookmark-fill"
                      }`}
                    ></i>
                    {assignment.formType}
                  </span>
                </td>
                <td>
                  {new Date(assignment.assignedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td>
                  {assignment.deadline
                    ? new Date(assignment.deadline).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : "N/A"}
                </td>
                <td>
                  {!isCompleted ? (
                    <button
                      className="manevap-btn manevap-btn-submit"
                      onClick={() => {
                        setCurrentAssignment(assignment);
                        setModalMode("submit");
                        const initialData =
                          assignment.competencies?.map((comp) => ({
                            competencyId: comp.competencyId,
                            competencyName: comp.name,
                            competencyDescription: comp.description,
                            rating: "",
                            comments: "",
                          })) || [];
                        setAssessmentData(initialData);
                        setShowModal(true);
                      }}
                    >
                      <i className="bi bi-pencil-square"></i> Submit
                    </button>
                  ) : (
                    <button
                      className="manevap-btn manevap-btn-view"
                      onClick={() => handleViewCompleted(assignment)}
                    >
                      <i className="bi bi-eye-fill"></i> View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="manevap-pagination-container">
        <div className="manevap-pagination-info">
          <span className="manevap-pagination-label">Show</span>
          <PaginationDropdown
            value={perPage}
            onChange={(val) => {
              setPerPage(Number(val));
              setPage(1);
            }}
            options={[5, 10, 15, 20]}
          />
          <span className="manevap-pagination-label">entries</span>
        </div>

        <nav className="manevap-pagination-nav">
          <ul className="manevap-pagination">
            <li
              className={`manevap-page-item ${
                currentPage === 1 ? "manevap-disabled" : ""
              }`}
            >
              <button
                className="manevap-page-link"
                onClick={() => onPageChange(currentPage - 1)}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li
                key={i + 1}
                className={`manevap-page-item ${
                  currentPage === i + 1 ? "manevap-active" : ""
                }`}
              >
                <button
                  className="manevap-page-link"
                  onClick={() => onPageChange(i + 1)}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li
              className={`manevap-page-item ${
                currentPage === totalPages ? "manevap-disabled" : ""
              }`}
            >
              <button
                className="manevap-page-link"
                onClick={() => onPageChange(currentPage + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </li>
          </ul>
        </nav>

        <div className="manevap-pagination-status">
          {totalItems === 0
            ? "No items to display"
            : `Showing ${Math.min(
                (currentPage - 1) * perPage + 1,
                totalItems
              )}-${Math.min(currentPage * perPage, totalItems)} of ${totalItems} items`}
        </div>
      </div>
    </>
  );
}
