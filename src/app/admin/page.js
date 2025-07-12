"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaDatabase, FaTable, FaPlus, FaEdit, FaTrash, FaArrowLeft, FaUserShield, FaSave, FaTimes } from "react-icons/fa";
import "../../styles/Admin.css";
import { generateUUID } from "../../utils/uuid";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [creatingRow, setCreatingRow] = useState(false);
  const [newRowData, setNewRowData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkAuth() {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw new Error(`Authentication error: ${JSON.stringify(userError)}`);
        
        if (!user) {
          router.push("/auth/signin?redirect=/admin");
          return;
        }
        
        setUser(user);
        
        const { data: superuserData, error: superuserError } = await supabase
          .from("superusers")
          .select("*")
          .eq("user_id", user.id)
          .single();
          
        if (superuserError && superuserError.code !== "PGRST116") {
          throw new Error(`Superuser check error: ${JSON.stringify(superuserError)}`);
        }
        
        if (superuserData) {
          setIsSuperuser(true);
          await fetchTables();
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setError(error.message || "Authentication check failed");
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [router, supabase]);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase.rpc("get_tables");
      if (error) throw new Error(`Failed to fetch tables: ${JSON.stringify(error)}`);
      
      setTables(data || []);
      if (data && data.length > 0) {
        setActiveTable(data[0].table_name);
        await fetchTableData(data[0].table_name);
      } else {
        setError("No tables found in the database");
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      setError(error.message || "Failed to fetch tables");
    }
  };

  const fetchTableData = async (tableName, page = 1, searchTerm = "") => {
    try {
      setActiveTable(tableName);
      setPage(page);
      setSearchTerm(searchTerm);
      
      const { data: columnsData, error: columnsError } = await supabase.rpc("get_columns", { 
        table_name: tableName 
      });
      
      if (columnsError) throw new Error(`Failed to fetch columns: ${JSON.stringify(columnsError)}`);
      setColumns(columnsData || []);
      
      const startRow = (page - 1) * rowsPerPage;
      const endRow = startRow + rowsPerPage - 1;
      
      let query = supabase.from(tableName).select("*", { count: "exact" });
      
      if (searchTerm) {
        const textColumns = columnsData.filter(c => 
          c.data_type.includes("char") || c.data_type.includes("text")
        ).map(c => c.column_name);
        
        if (textColumns.length > 0) {
          const searchConditions = textArray.map(col => 
            `${col}.ilike.%${searchTerm}%`
          );
          
          query = query.or(searchConditions阵.join(","));
        }
      }
      
      const { data, error, count } = await query
        .range(startRow, endRow)
        .order("created_at", { ascending: false, nullsFirst: false });
      
      if (error) throw new Error(`Failed to fetch table data: ${JSON.stringify(error)}`);
      
      setTableData(data || []);
      setTotalRows(count || 0);
      setTotalPages(Math.ceil(count / rowsPerPage));
    } catch (error) {
      console.error("Error fetching table data:", error);
      setError(error.message || "Failed to fetch table data");
    }
  };

  const handleEditRow = (row) => {
    setEditingRow(row);
    setEditingData({ ...row });
  };

  const handleSaveEdit = async () => {
    try {
      const primaryKeyColumn = columns.find(c => c.is_primary_key)?.column_name || "id";
      // Only update updated_at, never touch created_at
      let updatedData = { ...editingData };
      if (columns.find(c => c.column_name === "updated_at")) {
        updatedData["updated_at"] = new Date("2025-07-11T17:27:04+01:00").toISOString();
      }
      const { error } = await supabase
        .from(activeTable)
        .update(updatedData)
        .eq(primaryKeyColumn, editingRow[primaryKeyColumn]);
        
      if (error) throw new Error(`Failed to update row: ${JSON.stringify(error)}`);
      
      await fetchTableData(activeTable, page, searchTerm);
      setEditingRow(null);
      setEditingData({});
    } catch (error) {
      console.error("Error updating row:", error);
      setError(error.message || "Failed to update row");
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditingData({});
  };

  const handleCreateRow = () => {
    const initialData = {};
    columns.forEach(column => {
      if (!column.is_identity) {
        if (column.data_type && column.data_type.includes("uuid")) {
          initialData[column.column_name] = generateUUID();
        } else {
          initialData[column.column_name] = null;
        }
      }
    });
    // Set timestamps
    if (columns.find(c => c.column_name === "created_at")) {
      initialData["created_at"] = new Date("2025-07-11T17:27:04+01:00").toISOString();
    }
    if (columns.find(c => c.column_name === "updated_at")) {
      initialData["updated_at"] = new Date("2025-07-11T17:27:04+01:00").toISOString();
    }
    setNewRowData(initialData);
    setCreatingRow(true);
  };

  const handleSaveNewRow = async () => {
    try {
      let rowToInsert = { ...newRowData };
      if (columns.find(c => c.column_name === "created_at")) {
        rowToInsert["created_at"] = new Date("2025-07-11T17:27:04+01:00").toISOString();
      }
      if (columns.find(c => c.column_name === "updated_at")) {
        rowToInsert["updated_at"] = new Date("2025-07-11T17:27:04+01:00").toISOString();
      }
      const { error } = await supabase
        .from(activeTable)
        .insert(rowToInsert);
        
      if (error) throw new Error(`Failed to create row: ${JSON.stringify(error)}`);
      
      await fetchTableData(activeTable, page, searchTerm);
      setCreatingRow(false);
      setNewRowData({});
    } catch (error) {
      console.error("Error creating row:", error);
      setError(error.message || "Failed to create row");
    }
  };

  const handleCancelCreate = () => {
    setCreatingRow(false);
    setNewRowData({});
  };

  const handleDeleteRow = async (row) => {
    if (!confirm("Are you sure you want to delete this row? This action cannot be undone.")) return;
    
    try {
      const primaryKeyColumn = columns.find(c => c.is_primary_key)?.column_name || "id";
      const { error } = await supabase
        .from(activeTable)
        .delete()
        .eq(primaryKeyColumn, row[primaryKeyColumn]);
        
      if (error) throw new Error(`Failed to delete row: ${JSON.stringify(error)}`);
      
      await fetchTableData(activeTable, page, searchTerm);
    } catch (error) {
      console.error("Error deleting row:", error);
      setError(error.message || "Failed to delete row");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTableData(activeTable, 1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    fetchTableData(activeTable, newPage, searchTerm);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <Link href="/" className="back-to-home">
          Back to Home
        </Link>
      </div>
    );
  }

  if (!isSuperuser) {
    return (
      <div className="admin-unauthorized">
        <h2>Unauthorized</h2>
        <p>You do not have permission to access this page.</p>
        <Link href="/" className="back-to-home">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-left">
          <Link href="/" className="back-link">
            <FaArrowLeft /> Back to Site
          </Link>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="admin-header-right">
          <div className="admin-user">
            <FaUserShield className="admin-user-icon" />
            <span>{user?.email}</span>
          </div>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-sidebar">
          <h2>
            <FaDatabase /> Database Tables
          </h2>
          <ul className="tables-list">
            {tables.map(table => (
              <li 
                key={table.table_name} 
                className={activeTable === table.table_name ? "active" : ""}
                onClick={() => fetchTableData(table.table_name)}
              >
                <FaTable className="table-icon" />
                {table.table_name}
                <span className="table-count">{table.row_count}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="admin-main">
          {activeTable && (
            <>
              <div className="table-header">
                <h2>{activeTable}</h2>
                <div className="table-actions">
                  <form onSubmit={handleSearch} className="search-form">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button type="submit">Search</button>
                  </form>
                  <button className="create-btn" onClick={handleCreateRow}>
                    <FaPlus /> Add Row
                  </button>
                </div>
              </div>
              
              <div className="table-container" style={{height: '80vh', width: '100vw', maxWidth: '100%', overflow: 'auto', display: 'flex'}}>
  <div className="data-table-wrapper" style={{height: '100%', width: '100%', overflow: 'auto'}}>
    <table className="data-table" style={{height: '100%', minWidth: '1200px', width: '100%', tableLayout: 'auto', overflow: 'auto', display: 'block'}}>
                  <thead>
                    <tr>
                      <th className="actions-column">Actions</th>
                      {columns.map(column => (
                        <th key={column.column_name}>
                          {column.column_name}
                          {column.is_primary_key && <span className="primary-key-indicator">🔑</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {creatingRow && (
                      <tr className="creating-row">
                        <td className="actions-column">
                          <button className="save-btn" onClick={handleSaveNewRow} title="Save">
                            <FaSave />
                          </button>
                          <button className="cancel-btn" onClick={handleCancelCreate} title="Cancel">
                            <FaTimes />
                          </button>
                        </td>
                        {columns.map(column => (
  <td key={column.column_name}>
    {column.is_identity ? (
      <span className="auto-generated">(Auto)</span>
    ) : column.options || column.enum_values ? (
      <select
        value={newRowData[column.column_name] || ""}
        onChange={e => setNewRowData({
          ...newRowData,
          [column.column_name]: e.target.value || null,
        })}
      >
        <option value="">Select...</option>
        {(column.options || column.enum_values).map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    ) : (
      <input
        type={getInputType(column.data_type)}
        value={newRowData[column.column_name] || ""}
        onChange={e =>
          setNewRowData({
            ...newRowData,
            [column.column_name]: e.target.value || null,
          })
        }
      />
    )}
  </td>
))}
                      </tr>
                    )}
                    
                    {tableData.map(row => (
                      <tr key={row.id || JSON.stringify(row)}>
                        <td className="actions-column">
                          {editingRow === row ? (
                            <>
                              <button className="save-btn" onClick={handleSaveEdit} title="Save">
                                <FaSave />
                              </button>
                              <button className="cancel-btn" onClick={handleCancelEdit} title="Cancel">
                                <FaTimes />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="edit-btn" onClick={() => handleEditRow(row)} title="Edit">
                                <FaEdit />
                              </button>
                              <button className="delete-btn" onClick={() => handleDeleteRow(row)} title="Delete">
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </td>
                        {columns.map(column => (
  <td key={column.column_name}>
    {editingRow === row ? (
      column.is_identity ? (
        row[column.column_name]
      ) : column.options || column.enum_values ? (
        <select
          value={editingData[column.column_name] || ""}
          onChange={e => setEditingData({
            ...editingData,
            [column.column_name]: e.target.value || null,
          })}
        >
          <option value="">Select...</option>
          {(column.options || column.enum_values).map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={getInputType(column.data_type)}
          value={editingData[column.column_name] || ""}
          onChange={e =>
            setEditingData({
              ...editingData,
              [column.column_name]: e.target.value || null,
            })
          }
        />
      )
    ) : (
      formatCellValue(row[column.column_name])
    )}
  </td>
))}
                      </tr>
                    ))}
                    
                    {tableData.length === 0 && !creatingRow && (
                      <tr>
                        <td colSpan={columns.length + 1} className="no-data">
                          No data found. {searchTerm && "Try a different search term or "}
                          <button className="inline-create-btn" onClick={handleCreateRow}>
                            add a new row
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    onClick={() => handlePageChange(1)} 
                    disabled={page === 1}
                  >
                    First
                  </button>
                  <button 
                    onClick={() => handlePageChange(page - 1)} 
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {page} of {totalPages} ({totalRows} rows)
                  </span>
                  <button 
                    onClick={() => handlePageChange(page + 1)} 
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                  <button 
                    onClick={() => handlePageChange(totalPages)} 
                    disabled={page === totalPages}
                  >
                    Last
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getInputType(dataType) {
  if (dataType.includes("timestamp")) return "datetime-local";
  if (dataType.includes("date")) return "date";
  if (dataType.includes("time")) return "time";
  if (dataType === "integer" || dataType.includes("numeric")) return "number";
  if (dataType === "boolean") return "checkbox";
  if (dataType.includes("json")) return "textarea";
  return "text";
}

function formatCellValue(value) {
  if (value === null || value === undefined) return <span className="null-value">NULL</span>;
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && value.length > 100) return `${value.substring(0, 100)}...`;
  return value;
}