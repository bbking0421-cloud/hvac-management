1	// Google Apps Script API URL
     2	const API_BASE = 'https://script.google.com/macros/s/AKfycbzKnOxwx-AY4fg_bT88wHfR6w3BIbAytWnl8wrQ_MdSRj39LSYRYueDgx8Hl-RC1Jybuw/exec';
     3	
     4	// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    loadSiteFilter();
    loadDashboardData();
    
    // 필터 변경 이벤트 리스너 등록
    document.getElementById('periodFilter').addEventListener('change', loadDashboardData);
    document.getElementById('siteFilterDash').addEventListener('change', loadDashboardData);
    document.getElementById('statusFilter').addEventListener('change', loadDashboardData);
});
    10	// 현장 필터 로드
    11	async function loadSiteFilter() {
    12	    try {
    13	        const response = await fetch(`${API_BASE}?action=list&table=sites`);
    14	        const data = await response.json();
    15	        
    16	        const siteFilter = document.getElementById('siteFilterDash');
    17	        siteFilter.innerHTML = '<option value="">전체</option>';
    18	        
    19	        if (data.data && data.data.length > 0) {
    20	            data.data.forEach(site => {
    21	                const option = document.createElement('option');
    22	                option.value = site.id;
    23	                option.textContent = site.site_name;
    24	                siteFilter.appendChild(option);
    25	            });
    26	        }
    27	    } catch (error) {
    28	        console.error('현장 필터 로드 오류:', error);
    29	    }
    30	}
    31	
    32	// 대시보드 데이터 로드
    33	async function loadDashboardData() {
    34	    try {
    35	        // 필터 값 가져오기
    36	        const period = document.getElementById('periodFilter').value;
    37	        const siteId = document.getElementById('siteFilterDash').value;
    38	        const status = document.getElementById('statusFilter').value;
    39	
    40	        // 점검 데이터 가져오기
    41	        const inspectionsResponse = await fetch(`${API_BASE}?action=list&table=inspections`);
    42	        const inspectionsData = await inspectionsResponse.json();
    43	        
    44	        // 장비 데이터 가져오기
    45	        const equipmentResponse = await fetch(`${API_BASE}?action=list&table=equipment`);
    46	        const equipmentData = await equipmentResponse.json();
    47	
    48	        let inspections = inspectionsData.data || [];
    49	        const equipment = equipmentData.data || [];
    50	
    51	        // 기간 필터링
    52	        const now = new Date();
    53	        inspections = inspections.filter(inspection => {
    54	            const inspectionDate = new Date(inspection.inspection_date);
    55	            
    56	            if (period === 'today') {
    57	                return inspectionDate.toDateString() === now.toDateString();
    58	            } else if (period === 'week') {
    59	                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    60	                return inspectionDate >= weekAgo;
    61	            } else if (period === 'month') {
    62	                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    63	                return inspectionDate >= monthAgo;
    64	            }
    65	            return true;
    66	        });
    67	
    68	        // 현장 필터링
    69	        if (siteId) {
    70	            const siteEquipment = equipment.filter(eq => eq.site_id === siteId);
    71	            const siteEquipmentIds = siteEquipment.map(eq => eq.id);
    72	            inspections = inspections.filter(insp => siteEquipmentIds.includes(insp.equipment_id));
    73	        }
    74	
    75	        // 상태 필터링
    76	        if (status) {
    77	            inspections = inspections.filter(insp => insp.status === status);
    78	        }
    79	
    80	        // 통계 업데이트
    81	        updateStatistics(inspections);
    82	
    83	        // 차트 업데이트
    84	        updateCharts(inspections, equipment);
    85	
    86	        // 이상 장비 목록 업데이트
    87	        updateAlertList(inspections, equipment);
    88	
    89	        // 최근 점검 내역 업데이트
    90	        updateRecentInspections(inspections, equipment);
    91	
    92	    } catch (error) {
    93	        console.error('대시보드 데이터 로드 오류:', error);
    94	    }
    95	}
    96	
    97	// 통계 업데이트
    98	function updateStatistics(inspections) {
    99	    const total = inspections.length;
   100	    const normal = inspections.filter(i => i.status === '정상').length;
   101	    const warning = inspections.filter(i => i.status === '주의' || i.status === '경고').length;
   102	    const failure = inspections.filter(i => i.status === '고장').length;
   103	
   104	    document.getElementById('totalInspections').textContent = total;
   105	    document.getElementById('normalCount').textContent = normal;
   106	    document.getElementById('warningCount').textContent = warning;
   107	    document.getElementById('failureCount').textContent = failure;
   108	}
   109	
   110	// 차트 업데이트
   111	let statusChart, trendChart, equipmentTypeChart, siteChart;
   112	
   113	function updateCharts(inspections, equipment) {
   114	    // 상태 분포 차트
   115	    updateStatusChart(inspections);
   116	    
   117	    // 점검 추이 차트
   118	    updateTrendChart(inspections);
   119	    
   120	    // 장비 유형별 차트
   121	    updateEquipmentTypeChart(inspections, equipment);
   122	    
   123	    // 현장별 차트
   124	    updateSiteChart(inspections, equipment);
   125	}
   126	
   127	// 상태 분포 도넛 차트
   128	function updateStatusChart(inspections) {
   129	    const statusCounts = {
   130	        '정상': inspections.filter(i => i.status === '정상').length,
   131	        '주의': inspections.filter(i => i.status === '주의').length,
   132	        '경고': inspections.filter(i => i.status === '경고').length,
   133	        '고장': inspections.filter(i => i.status === '고장').length
   134	    };
   135	
   136	    const ctx = document.getElementById('statusChart').getContext('2d');
   137	    
   138	    if (statusChart) {
   139	        statusChart.destroy();
   140	    }
   141	
   142	    statusChart = new Chart(ctx, {
   143	        type: 'doughnut',
   144	        data: {
   145	            labels: Object.keys(statusCounts),
   146	            datasets: [{
   147	                data: Object.values(statusCounts),
   148	                backgroundColor: ['#4CAF50', '#FF9800', '#F44336', '#9E9E9E']
   149	            }]
   150	        },
   151	        options: {
   152	            responsive: true,
   153	            maintainAspectRatio: false,
   154	            plugins: {
   155	                legend: {
   156	                    position: 'bottom'
   157	                }
   158	            }
   159	        }
   160	    });
   161	}
   162	
   163	// 점검 추이 선 차트
   164	function updateTrendChart(inspections) {
   165	    // 최근 7일 데이터
   166	    const last7Days = [];
   167	    const now = new Date();
   168	    
   169	    for (let i = 6; i >= 0; i--) {
   170	        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
   171	        last7Days.push(date.toISOString().split('T')[0]);
   172	    }
   173	
   174	    const dailyCounts = last7Days.map(date => {
   175	        return inspections.filter(insp => {
   176	            const inspDate = new Date(insp.inspection_date).toISOString().split('T')[0];
   177	            return inspDate === date;
   178	        }).length;
   179	    });
   180	
   181	    const ctx = document.getElementById('trendChart').getContext('2d');
   182	    
   183	    if (trendChart) {
   184	        trendChart.destroy();
   185	    }
   186	
   187	    trendChart = new Chart(ctx, {
   188	        type: 'line',
   189	        data: {
   190	            labels: last7Days.map(date => {
   191	                const d = new Date(date);
   192	                return `${d.getMonth() + 1}/${d.getDate()}`;
   193	            }),
   194	            datasets: [{
   195	                label: '점검 수',
   196	                data: dailyCounts,
   197	                borderColor: '#667eea',
   198	                backgroundColor: 'rgba(102, 126, 234, 0.1)',
   199	                tension: 0.4,
   200	                fill: true
   201	            }]
   202	        },
   203	        options: {
   204	            responsive: true,
   205	            maintainAspectRatio: false,
   206	            plugins: {
   207	                legend: {
   208	                    display: false
   209	                }
   210	            },
   211	            scales: {
   212	                y: {
   213	                    beginAtZero: true,
   214	                    ticks: {
   215	                        stepSize: 1
   216	                    }
   217	                }
   218	            }
   219	        }
   220	    });
   221	}
   222	
   223	// 장비 유형별 바 차트
   224	function updateEquipmentTypeChart(inspections, equipment) {
   225	    const equipmentMap = {};
   226	    equipment.forEach(eq => {
   227	        equipmentMap[eq.id] = eq.equipment_type;
   228	    });
   229	
   230	    const typeCounts = {};
   231	    inspections.forEach(insp => {
   232	        const type = equipmentMap[insp.equipment_id] || '기타';
   233	        typeCounts[type] = (typeCounts[type] || 0) + 1;
   234	    });
   235	
   236	    const ctx = document.getElementById('equipmentTypeChart').getContext('2d');
   237	    
   238	    if (equipmentTypeChart) {
   239	        equipmentTypeChart.destroy();
   240	    }
   241	
   242	    equipmentTypeChart = new Chart(ctx, {
   243	        type: 'bar',
   244	        data: {
   245	            labels: Object.keys(typeCounts),
   246	            datasets: [{
   247	                label: '점검 수',
   248	                data: Object.values(typeCounts),
   249	                backgroundColor: '#667eea'
   250	            }]
   251	        },
   252	        options: {
   253	            responsive: true,
   254	            maintainAspectRatio: false,
   255	            plugins: {
   256	                legend: {
   257	                    display: false
   258	                }
   259	            },
   260	            scales: {
   261	                y: {
   262	                    beginAtZero: true,
   263	                    ticks: {
   264	                        stepSize: 1
   265	                    }
   266	                }
   267	            }
   268	        }
   269	    });
   270	}
   271	
   272	// 현장별 가로 바 차트
   273	function updateSiteChart(inspections, equipment) {
   274	    const equipmentMap = {};
   275	    equipment.forEach(eq => {
   276	        equipmentMap[eq.id] = eq.site_id;
   277	    });
   278	
   279	    const siteCounts = {};
   280	    inspections.forEach(insp => {
   281	        const siteId = equipmentMap[insp.equipment_id];
   282	        siteCounts[siteId] = (siteCounts[siteId] || 0) + 1;
   283	    });
   284	
   285	    const ctx = document.getElementById('siteChart').getContext('2d');
   286	    
   287	    if (siteChart) {
   288	        siteChart.destroy();
   289	    }
   290	
   291	    siteChart = new Chart(ctx, {
   292	        type: 'bar',
   293	        data: {
   294	            labels: Object.keys(siteCounts),
   295	            datasets: [{
   296	                label: '점검 수',
   297	                data: Object.values(siteCounts),
   298	                backgroundColor: '#764ba2'
   299	            }]
   300	        },
   301	        options: {
   302	            indexAxis: 'y',
   303	            responsive: true,
   304	            maintainAspectRatio: false,
   305	            plugins: {
   306	                legend: {
   307	                    display: false
   308	                }
   309	            },
   310	            scales: {
   311	                x: {
   312	                    beginAtZero: true,
   313	                    ticks: {
   314	                        stepSize: 1
   315	                    }
   316	                }
   317	            }
   318	        }
   319	    });
   320	}
   321	
   322	// 이상 장비 목록 업데이트
   323	function updateAlertList(inspections, equipment) {
   324	    const alertList = document.getElementById('alertList');
   325	    
   326	    const alerts = inspections.filter(insp => 
   327	        insp.status === '주의' || insp.status === '경고' || insp.status === '고장'
   328	    );
   329	
   330	    if (alerts.length === 0) {
   331	        alertList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">이상 장비가 없습니다.</p>';
   332	        return;
   333	    }
   334	
   335	    const equipmentMap = {};
   336	    equipment.forEach(eq => {
   337	        equipmentMap[eq.id] = eq;
   338	    });
   339	
   340	    alertList.innerHTML = alerts.map(insp => {
   341	        const eq = equipmentMap[insp.equipment_id] || {};
   342	        const statusColor = getStatusColor(insp.status);
   343	        
   344	        return `
   345	            <div class="alert-item" style="border-left: 4px solid ${statusColor}">
   346	                <div class="alert-header">
   347	                    <span class="alert-equipment">${eq.equipment_type || '알 수 없음'} (${eq.model || '-'})</span>
   348	                    <span class="alert-status" style="background-color: ${statusColor}">${insp.status}</span>
   349	                </div>
   350	                <div class="alert-info">
   351	                    <i class="fas fa-map-marker-alt"></i> ${eq.location || '-'} (${eq.floor || '-'})
   352	                </div>
   353	                <div class="alert-info">
   354	                    <i class="fas fa-exclamation-circle"></i> ${insp.notes || '특이사항 없음'}
   355	                </div>
   356	                <div class="alert-info">
   357	                    <i class="fas fa-clock"></i> ${formatDate(insp.inspection_date)}
   358	                </div>
   359	            </div>
   360	        `;
   361	    }).join('');
   362	}
   363	
   364	// 최근 점검 내역 업데이트
   365	function updateRecentInspections(inspections, equipment) {
   366	    const tbody = document.querySelector('#recentInspections tbody');
   367	    
   368	    if (inspections.length === 0) {
   369	        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">점검 내역이 없습니다.</td></tr>';
   370	        return;
   371	    }
   372	
   373	    const equipmentMap = {};
   374	    equipment.forEach(eq => {
   375	        equipmentMap[eq.id] = eq;
   376	    });
   377	
   378	    // 최근 10개만 표시
   379	    const recentInspections = inspections
   380	        .sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))
   381	        .slice(0, 10);
   382	
   383	    tbody.innerHTML = recentInspections.map(insp => {
   384	        const eq = equipmentMap[insp.equipment_id] || {};
   385	        const statusColor = getStatusColor(insp.status);
   386	        
   387	        return `
   388	            <tr>
   389	                <td>${formatDate(insp.inspection_date)}</td>
   390	                <td>${insp.inspector_name}</td>
   391	                <td>${eq.equipment_type || '알 수 없음'}<br><small>${eq.model || '-'}</small></td>
   392	                <td>${eq.location || '-'}<br><small>${eq.floor || '-'}</small></td>
   393	                <td><span class="status-badge" style="background-color: ${statusColor}">${insp.status}</span></td>
   394	                <td>${insp.notes || '-'}</td>
   395	            </tr>
   396	        `;
   397	    }).join('');
   398	}
   399	
   400	// 유틸리티 함수
   401	function getStatusColor(status) {
   402	    const colors = {
   403	        '정상': '#4CAF50',
   404	        '주의': '#FF9800',
   405	        '경고': '#F44336',
   406	        '고장': '#9E9E9E'
   407	    };
   408	    return colors[status] || '#2196F3';
   409	}
   410	
   411	function formatDate(dateString) {
   412	    const date = new Date(dateString);
   413	    return date.toLocaleDateString('ko-KR', {
   414	        year: 'numeric',
   415	        month: '2-digit',
   416	        day: '2-digit',
   417	        hour: '2-digit',
   418	        minute: '2-digit'
   419	    });
   420	}
   421	
