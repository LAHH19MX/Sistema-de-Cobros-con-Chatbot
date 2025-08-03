// src/components/tenant/IngresosTenant.tsx
import React, { useEffect } from 'react';
import '../../styles/tenant/IngresosTenant.css';

const IngresosTenant: React.FC = () => {
  useEffect(() => {
    // Selector de período en gráfico
    const periodBtns = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.tenant-inc__period-btn')
    );
    periodBtns.forEach((btn) =>
      btn.addEventListener('click', (e) => {
        periodBtns.forEach((b) => b.classList.remove('active'));
        (e.currentTarget as HTMLButtonElement).classList.add('active');
      })
    );

    // Función de filtrado de la tabla
    const applyFilterBtn = document.getElementById('tenant-inc-apply-filter')!;
    const onFilter = () => {
      const startDate = new Date(
        (document.getElementById('tenant-inc-start-date') as HTMLInputElement).value
      );
      const endDate = new Date(
        (document.getElementById('tenant-inc-end-date') as HTMLInputElement).value
      );
      const statusFilter = (
        document.getElementById('tenant-inc-status-filter') as HTMLSelectElement
      ).value;
      const rows = Array.from(
        document.querySelectorAll<HTMLTableRowElement>('#tenant-inc-income-table tbody tr')
      );
      rows.forEach((row) => {
        const dateText = row.cells[1].textContent!.split('/').reverse().join('-');
        const rowDate = new Date(dateText);
        const rowStatus = row.cells[4]
          .querySelector('.tenant-inc__status-text')!
          .textContent!;
        const dateInRange = rowDate >= startDate && rowDate <= endDate;
        const statusMatch = statusFilter === 'all' || rowStatus === statusFilter;
        row.style.display = dateInRange && statusMatch ? '' : 'none';
      });
    };
    applyFilterBtn.addEventListener('click', onFilter);

    // Inicializar filtro con Pagados
    (document.getElementById('tenant-inc-status-filter') as HTMLSelectElement).value =
      'Pagado';
    applyFilterBtn.click();

    // Limpieza de listeners al desmontar
    return () => {
      periodBtns.forEach((btn) => btn.removeEventListener('click', () => {}));
      applyFilterBtn.removeEventListener('click', onFilter);
    };
  }, []);

  return (
    <section className="tenant-inc">
      {/* Header de página */}
      <header className="tenant-inc__header">
        <h1 className="tenant-inc__title">Reporte de Ingresos</h1>
        <p className="tenant-inc__subtitle">
          Monitorea y analiza los ingresos de tu negocio
        </p>
      </header>

      <div className="tenant-inc__main-section">
        {/* Gráfico de ingresos */}
        <div className="tenant-inc__chart-container">
          <div className="tenant-inc__chart-header">
            <h3>
              <i className="fas fa-chart-bar me-2"></i> Evolución de Ingresos
              Mensuales
            </h3>
            <div className="tenant-inc__chart-period-selector">
              <button className="tenant-inc__period-btn active">Mensual</button>
              <button className="tenant-inc__period-btn">Trimestral</button>
              <button className="tenant-inc__period-btn">Anual</button>
            </div>
          </div>
          <div className="tenant-inc__chart-placeholder">
            <i className="fas fa-chart-line me-2"></i> Gráfico de ingresos
            interactivo
          </div>
        </div>

        {/* Filtros de fechas */}
        <div className="tenant-inc__date-filters">
          <div className="tenant-inc__date-filters-header">
            <h3>
              <i className="fas fa-filter me-2"></i> Filtrar Ingresos
            </h3>
          </div>
          <div className="tenant-inc__date-range-selector">
            <div className="tenant-inc__date-filter-group">
              <label htmlFor="tenant-inc-start-date">Fecha de inicio</label>
              <input
                type="date"
                id="tenant-inc-start-date"
                defaultValue="2025-01-01"
              />
            </div>
            <div className="tenant-inc__date-filter-group">
              <label htmlFor="tenant-inc-end-date">Fecha de fin</label>
              <input
                type="date"
                id="tenant-inc-end-date"
                defaultValue="2025-07-15"
              />
            </div>
            <div className="tenant-inc__date-filter-group">
              <label htmlFor="tenant-inc-status-filter">Estado</label>
              <select
                id="tenant-inc-status-filter"
                className="form-select tenant-inc__status-select"
              >
                <option value="all">Todos los estados</option>
                <option value="Pagado">Pagado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <button
              className="tenant-inc__btn-filter"
              id="tenant-inc-apply-filter"
            >
              <i className="fas fa-filter me-2"></i>Aplicar Filtros
            </button>
          </div>
        </div>

        {/* Tabla de ingresos recientes */}
        <div className="tenant-inc__recent-income">
          <div className="tenant-inc__recent-header">
            <h3>Ingresos Registrados</h3>
          </div>
          <div className="table-responsive">
            <table
              className="table tenant-inc__table"
              id="tenant-inc-income-table"
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Monto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td data-label="#">1</td>
                  <td data-label="Fecha">15/07/2025</td>
                  <td data-label="Cliente">Juan Pérez</td>
                  <td data-label="Método">Transferencia</td>
                  <td data-label="Estado">
                    <span className="tenant-inc__status-text status-text">
                      Pagado
                    </span>
                  </td>
                  <td data-label="Monto">$1,200.00</td>
                  <td data-label="Acciones">
                    <button className="tenant-inc__view-btn view-btn">
                      <i className="fas fa-eye"></i> Detalles
                    </button>
                  </td>
                </tr>
                {/* …más filas… */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IngresosTenant;
