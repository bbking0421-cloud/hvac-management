// 전역 변수
let allInspections = [];
let allEquipment = [];
let allSites = [];
let charts = {};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    await loadSiteFilter();
    await loadDashboardData();
});

// 현장 필터 로드
async function loadSiteFilter() {
    try {
        const response = await fetch(`${API_BASE}/sites?limit=1000`);
        const data = await response.json();
        allSites = data.data;
        
        const select = document.getElementById('siteFilterDash');
        select.innerHTML = '<option value="">전체</option>';
        allSites.forEach(site => {
            select.innerHTML += `<option value="${site.id}">${site.site_name}</option>`;
        });
    } catch (error) {
        console.error('현장 필터 로드 오류:', error);
    }
}

// 대시보드 데이터 로드
async function loadDashboardData() {
    try {
        // 점검 데이터 로드
        const inspResponse = await fetch(`${API_BASE}/inspections?limit=1000`);
        const inspData = await inspResponse.json();
        allInspections = inspData.data;
        
        // 장비 데이터 로드
        const eqResponse = await fetch(`${API_BASE}/equipment?limit=1000`);
        const eqData = await eqResponse.json();
        allEquipment = eqData.data;
        
        // 필터 적용
        const filteredInspections = applyFilters(allInspections);
        
        // 통계 업데이트
        updateStatistics(filteredInspections);
        
        // 차트 업데이트
        updateCharts(filteredInspections);
        
        // 이상 장비 목록 업데이트
        updateAlertList(filteredInspections);
        
        // 최근 점검 내역 업데이트
        updateRecentInspections(filteredInspections);
        
    } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
        alert('데이터를 불러오는데 실패했습니다.');
    }
}

// 필터 적용
function applyFilters(inspections) {
    let filtered = [...inspections];
    
    // 기간 필터
    const periodFilter = document.getElementById('periodFilter').value;
    const now = new Date();
    
    if (periodFilter === 'today') {
        const today = now.toISOString().split('T')[0];
        filtered = filtered.filter(i => {
            const inspDate = new Date(i.inspection_date).toISOString().split('T')[0];
            return inspDate === today;
        });
    } else if (periodFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(i => new Date(i.inspection_date) >= weekAgo);
    } else if (periodFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(i => new Date(i.inspection_date) >= monthAgo);
    }
    
    // 현장 필터
    const siteFilter = document.getElementById('siteFilterDash').value;
    if (siteFilter) {
        const siteEquipmentIds = allEquipment
            .filter(eq => eq.site_id === siteFilter)
            .map(eq => eq.id);
        filtered = filtered.filter(i => siteEquipmentIds.includes(i.equipment_id));
    }
    
    // 상태 필터
    const statusFilter = document.getElementById('statusFilter').value;
    if (statusFilter) {
        filtered = filtered.filter(i => i.status === statusFilter);
    }
    
    return filtered;
}

// 통계 업데이트
function updateStatistics(inspections) {
    document.getElementById('totalInspections').textContent = inspections.length;
    
    const normalCount = inspections.filter(i => i.status === '정상').length;
    const warningCount = inspections.filter(i => ['주의', '경고'].includes(i.status)).length;
    const failureCount = inspections.filter(i => i.status === '고장').length;
    
    document.getElementById('normalCount').textContent = normalCount;
    document.getElementById('warningCount').textContent = warningCount;
    document.getElementById('failureCount').textContent = failureCount;
}

// 차트 업데이트
function updateCharts(inspections) {
    // 1. 장비 상태 분포 차트
    updateStatusChart(inspections);
    
    // 2. 점검 추이 차트
    updateTrendChart(inspections);
    
    // 3. 장비 유형별 차트
    updateEquipmentTypeChart(inspections);
    
    // 4. 현장별 차트
    updateSiteChart(inspections);
}

// 장비 상태 분포 차트
function updateStatusChart(inspections) {
    const statusCounts = {
        '정상': 0,
        '주의': 0,
        '경고': 0,
        '고장': 0
    };
    
    inspections.forEach(i => {
        if (statusCounts.hasOwnProperty(i.status)) {
            statusCounts[i.status]++;
        }
    });
    
    const ctx = document.getElementById('statusChart');
    
    if (charts.status) {
        charts.status.destroy();
    }
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['정상', '주의', '경고', '고장'],
            datasets: [{
                data: [statusCounts['정상'], statusCounts['주의'], statusCounts['경고'], statusCounts['고장']],
                backgroundColor: ['#4CAF50', '#FF9800', '#F44336', '#9E9E9E'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 점검 추이 차트
function updateTrendChart(inspections) {
    // 날짜별 점검 수 집계
    const dateCounts = {};
    
    inspections.forEach(i => {
        const date = new Date(i.inspection_date).toISOString().split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    
    // 날짜 정렬
    const sortedDates = Object.keys(dateCounts).sort();
    const counts = sortedDates.map(date => dateCounts[date]);
    
    const ctx = document.getElementById('trendChart');
    
    if (charts.trend) {
        charts.trend.destroy();
    }
    
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates.map(d => {
                const date = new Date(d);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            }),
            datasets: [{
                label: '점검 수',
                data: counts,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 장비 유형별 차트
function updateEquipmentTypeChart(inspections) {
    const typeCounts = {};
    
    inspections.forEach(i => {
        const equipment = allEquipment.find(eq => eq.id === i.equipment_id);
        if (equipment) {
            const type = equipment.equipment_type;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
    });
    
    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);
    
    const ctx = document.getElementById('equipmentTypeChart');
    
    if (charts.equipmentType) {
        charts.equipmentType.destroy();
    }
    
    charts.equipmentType = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '점검 수',
                data: data,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: '#667eea',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 현장별 차트
function updateSiteChart(inspections) {
    const siteCounts = {};
    
    inspections.forEach(i => {
        const equipment = allEquipment.find(eq => eq.id === i.equipment_id);
        if (equipment) {
            const site = allSites.find(s => s.id === equipment.site_id);
            if (site) {
                siteCounts[site.site_name] = (siteCounts[site.site_name] || 0) + 1;
            }
        }
    });
    
    const labels = Object.keys(siteCounts);
    const data = Object.values(siteCounts);
    
    const ctx = document.getElementById('siteChart');
    
    if (charts.site) {
        charts.site.destroy();
    }
    
    charts.site = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '점검 수',
                data: data,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(76, 175, 80, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 이상 장비 목록 업데이트
function updateAlertList(inspections) {
    const alertList = document.getElementById('alertList');
    
    // 주의, 경고, 고장 상태만 필터
    const alerts = inspections.filter(i => ['주의', '경고', '고장'].includes(i.status))
        .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))
        .slice(0, 10);
    
    if (alerts.length === 0) {
        alertList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-check-circle"></i>
                <p>이상 장비가 없습니다!</p>
            </div>
        `;
        return;
    }
    
    alertList.innerHTML = '';
    
    alerts.forEach(alert => {
        const equipment = allEquipment.find(eq => eq.id === alert.equipment_id);
        if (!equipment) return;
        
        const severityClass = alert.status === '경고' || alert.status === '고장' ? 'danger' : 'warning';
        
        const card = document.createElement('div');
        card.className = `alert-card ${severityClass}`;
        card.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">${equipment.equipment_type}</div>
                <div class="alert-badge ${severityClass}">${alert.status}</div>
            </div>
            <div class="alert-info">
                <div><i class="fas fa-tag"></i> ${equipment.id}</div>
                <div><i class="fas fa-map-marker-alt"></i> ${equipment.floor} - ${equipment.location}</div>
                <div><i class="fas fa-user"></i> ${alert.inspector_name}</div>
                <div><i class="fas fa-calendar"></i> ${formatDate(alert.inspection_date)}</div>
            </div>
            ${alert.notes ? `<div class="alert-notes"><i class="fas fa-exclamation-triangle"></i> ${alert.notes}</div>` : ''}
        `;
        alertList.appendChild(card);
    });
}

// 최근 점검 내역 업데이트
function updateRecentInspections(inspections) {
    const tbody = document.querySelector('#recentInspections tbody');
    
    // 최근 순으로 정렬
    const recent = [...inspections]
        .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))
        .slice(0, 20);
    
    if (recent.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    점검 내역이 없습니다.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    recent.forEach(insp => {
        const equipment = allEquipment.find(eq => eq.id === insp.equipment_id);
        if (!equipment) return;
        
        const statusClass = {
            '정상': 'normal',
            '주의': 'warning',
            '경고': 'danger',
            '고장': 'error'
        }[insp.status] || 'normal';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(insp.inspection_date)}</td>
            <td>${insp.inspector_name}</td>
            <td>${equipment.equipment_type} (${equipment.id})</td>
            <td>${equipment.floor} - ${equipment.location}</td>
            <td><span class="status-badge ${statusClass}">${insp.status}</span></td>
            <td>${insp.notes || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}
