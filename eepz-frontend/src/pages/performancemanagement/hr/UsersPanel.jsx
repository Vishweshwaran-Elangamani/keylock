import React from "react";
import { PaginationDropdown } from "./FormListComponents";

function UsersPanel({
  selectedFormId,
  pagedUsers,
  assignedUserIds,
  selectedUserIds,
  toggleUser,
  handleSelectAll,
  allEligibleSelected,
  userSearchInput,
  setUserSearchInput,
  setUserSearchQuery,
  setUsersPage,
  openDeadlineModal,
  usersTotalPages,
  usersPage,
  onUsersPageChange,
  usersPerPage,
  setUsersPerPage,
}) {
  return (
    <div className="flp-users-panel">
      <div className="flp-panel-header">
        <h3>
          <i className="bi bi-people-fill"></i> Select Users
        </h3>
        {selectedFormId && (
          <div className="flp-users-filters">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                overflow: "hidden",
                flex: 1,
              }}
            >
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchInput}
                onChange={(e) => setUserSearchInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    setUserSearchQuery(userSearchInput);
                    setUsersPage(1);
                  }
                }}
                style={{
                  border: "none",
                  padding: "8px 12px",
                  outline: "none",
                  flex: 1,
                }}
              />
              <button
                onClick={() => {
                  setUserSearchQuery(userSearchInput);
                  setUsersPage(1);
                }}
                style={{
                  backgroundColor: "#27235c",
                  color: "#fff",
                  border: "none",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <i className="bi bi-search"></i>
              </button>
            </div>

            <button
              onClick={handleSelectAll}
              className="flp-btn-select-all"
              style={{
                background: allEligibleSelected ? "#AC5098" : "#27235C",
                color: "#fff",
              }}
              title={allEligibleSelected ? "Deselect All" : "Select All"}
            >
              {allEligibleSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        )}
      </div>

      <div className="flp-panel-body">
        {!selectedFormId ? (
          <div className="flp-empty-box">
            <i className="bi bi-hand-index"></i>
            <p>Please choose a form to select users</p>
          </div>
        ) : pagedUsers.length === 0 ? (
          <div className="flp-empty-box">
            <i className="bi bi-inbox"></i>
            <p>No users available</p>
          </div>
        ) : (
          <>
            <div className="flp-selected-count">
              <i className="bi bi-check-circle-fill"></i>
              <strong>{selectedUserIds.length}</strong> user(s) selected
            </div>
            {pagedUsers.map((user) => {
              const isAssigned = assignedUserIds
                .map(String)
                .includes(String(user.userId));
              const isSelected = selectedUserIds.includes(user.userId);
              return (
                <div
                  key={user.userId}
                  className={`flp-user-card ${
                    isSelected ? "flp-selected" : ""
                  } ${isAssigned ? "flp-disabled" : ""}`}
                  onClick={() => !isAssigned && toggleUser(user.userId)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    disabled={isAssigned}
                  />
                  <div className="flp-user-info">
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    {isAssigned && (
                      <span className="flp-assigned-tag">
                        <i className="bi bi-lock-fill"></i> Assigned
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {usersTotalPages > 0 && (
        <div className="flp-pagination-container">
          <div className="flp-pagination-info">
            <span className="flp-pagination-label">Rows per page:</span>
            <PaginationDropdown
              value={usersPerPage}
              onChange={(val) => {
                setUsersPerPage(Number(val));
                setUsersPage(1);
              }}
              options={[5, 10, 15, 20]}
            />
          </div>

          <nav className="flp-pagination-nav">
            <ul className="flp-pagination">
              <li
                className={`flp-page-item ${
                  usersPage === 1 ? "flp-disabled" : ""
                }`}
              >
                <button
                  className="flp-page-link"
                  onClick={() => onUsersPageChange(usersPage - 1)}
                >
                  &laquo;
                </button>
              </li>
              {Array.from({ length: usersTotalPages }, (_, i) => (
                <li
                  key={i + 1}
                  className={`flp-page-item ${
                    usersPage === i + 1 ? "flp-active" : ""
                  }`}
                >
                  <button
                    className="flp-page-link"
                    onClick={() => onUsersPageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li
                className={`flp-page-item ${
                  usersPage === usersTotalPages ? "flp-disabled" : ""
                }`}
              >
                <button
                  className="flp-page-link"
                  onClick={() => onUsersPageChange(usersPage + 1)}
                >
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <div className="flp-panel-footer">
        <button
          className="flp-btn-share"
          onClick={() => openDeadlineModal("Send")}
          disabled={!selectedFormId || selectedUserIds.length === 0}
        >
          <i className="bi bi-send-fill"></i> Share
        </button>
      </div>
    </div>
  );
}

export default UsersPanel;
