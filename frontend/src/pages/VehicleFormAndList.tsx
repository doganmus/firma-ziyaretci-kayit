import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import {
    Form, Input, Button, Card, Typography, Table, Row, Col, Select,
    DatePicker, Space, message, Tooltip
} from 'antd'
import {
    SaveOutlined, EditOutlined, FilterOutlined, FileExcelOutlined,
    CarOutlined, CheckCircleFilled, CloseCircleOutlined, CloseOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

type FormValues = {
    plate: string
    district?: string
    vehicle_type?: string
    vehicle_status?: 'BOŞ' | 'DOLU'
    note?: string
    entry_at?: Dayjs
    exit_at?: Dayjs
}

type VehicleRecord = {
    id: string
    plate: string
    entry_at: string | null
    exit_at: string | null
    district?: string | null
    vehicle_type?: string | null
    vehicle_status?: string | null
    note?: string | null
}

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/

export default function VehicleFormAndList() {
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<VehicleRecord[]>([])
    const [editing, setEditing] = useState<VehicleRecord | null>(null)
    const [isEditMode, setIsEditMode] = useState(false)
    const [isExitMode, setIsExitMode] = useState(false)  // Çıkış ekleme modu
    const [form] = Form.useForm<FormValues>()

    // Rol bazlı yetki kontrolleri
    const role = (() => {
        try {
            const u = localStorage.getItem('user')
            return u ? (JSON.parse(u).role as string) : null
        } catch { return null }
    })()
    const isAdmin = role === 'ADMIN'
    const isManager = role === 'MANAGER'
    const isOperator = role === 'OPERATOR'
    const isViewer = role === 'VIEWER'
    const canFullEdit = isAdmin || isManager  // Full düzenleme yetkisi
    const canAddExit = isAdmin || isManager || isOperator  // Çıkış ekleme yetkisi
    const canCreate = isAdmin || isManager || isOperator  // Yeni kayıt oluşturma yetkisi

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)

    // Filter state
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null)
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
    const [filterPlate, setFilterPlate] = useState('')
    const [filterVehicleType, setFilterVehicleType] = useState('')

    const loadData = async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (dateRange && dateRange[0]) params.dateFrom = dateRange[0].toDate().toISOString()
            if (dateRange && dateRange[1]) params.dateTo = dateRange[1].toDate().toISOString()
            if (filterPlate) params.plate = filterPlate
            if (filterVehicleType) params.vehicleType = filterVehicleType
            if (sortKey) params.sortKey = sortKey
            if (sortOrder) params.sortOrder = sortOrder === 'ascend' ? 'asc' : 'desc'
            params.page = page
            params.pageSize = pageSize
            const res = await api.get<{ data: VehicleRecord[]; total: number }>('/vehicle-records', { params })
            setItems(res.data.data || [])
            setTotal(res.data.total || 0)
        } catch (error) {
            console.error('Veri yüklenirken hata:', error)
            setItems([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, sortKey, sortOrder])

    const submit = async () => {
        setLoading(true)
        try {
            const values = await form.validateFields()
            const normalizedPlate = (values.plate ?? '').replace(/\s+/g, '').toUpperCase()

            if (isExitMode && editing) {
                // Sadece çıkış ekleme modu (OPERATOR için)
                if (!values.exit_at) {
                    message.error('Çıkış tarihi gerekli')
                    setLoading(false)
                    return
                }
                const exit_at = dayjs(values.exit_at).toISOString()

                // Çıkış tarihi giriş tarihinden sonra olmalı
                if (editing.entry_at && dayjs(exit_at).isBefore(editing.entry_at)) {
                    message.error('Çıkış tarihi giriş tarihinden sonra olmalıdır')
                    setLoading(false)
                    return
                }

                await api.patch(`/vehicle-records/${editing.id}/exit`, { exit_at })
                message.success('Çıkış kaydedildi')
            } else if (isEditMode && editing) {
                // Düzenleme modu - kayıt güncelle (ADMIN/MANAGER için)
                // En az bir tarih olmalı
                if (!values.entry_at && !values.exit_at) {
                    message.error('En az giriş veya çıkış tarihi girilmelidir')
                    setLoading(false)
                    return
                }

                // Eğer hem giriş hem çıkış varsa, çıkış > giriş olmalı
                if (values.entry_at && values.exit_at) {
                    if (dayjs(values.exit_at).isBefore(values.entry_at) || dayjs(values.exit_at).isSame(values.entry_at)) {
                        message.error('Çıkış tarihi giriş tarihinden sonra olmalıdır')
                        setLoading(false)
                        return
                    }
                }

                const payload: any = {
                    plate: normalizedPlate,
                    district: values.district || null,
                    vehicle_type: values.vehicle_type || null,
                    vehicle_status: values.vehicle_status || null,
                    note: values.note || null,
                }
                if (values.entry_at) {
                    payload.entry_at = dayjs(values.entry_at).toISOString()
                } else {
                    payload.entry_at = null
                }
                if (values.exit_at) {
                    payload.exit_at = dayjs(values.exit_at).toISOString()
                } else {
                    payload.exit_at = null
                }
                await api.patch(`/vehicle-records/${editing.id}`, payload)
                message.success('Kayıt güncellendi')
            } else {
                // Yeni kayıt oluştur
                // En az bir tarih olmalı
                if (!values.entry_at && !values.exit_at) {
                    message.error('En az giriş veya çıkış tarihi girilmelidir')
                    setLoading(false)
                    return
                }

                // Eğer hem giriş hem çıkış varsa, çıkış > giriş olmalı
                if (values.entry_at && values.exit_at) {
                    if (dayjs(values.exit_at).isBefore(values.entry_at) || dayjs(values.exit_at).isSame(values.entry_at)) {
                        message.error('Çıkış tarihi giriş tarihinden sonra olmalıdır')
                        setLoading(false)
                        return
                    }
                }

                const payload: any = {
                    plate: normalizedPlate,
                    district: values.district || null,
                    vehicle_type: values.vehicle_type || null,
                    vehicle_status: values.vehicle_status,
                    note: values.note || null,
                }
                if (values.entry_at) {
                    payload.entry_at = dayjs(values.entry_at).toISOString()
                }
                if (values.exit_at) {
                    payload.exit_at = dayjs(values.exit_at).toISOString()
                }
                await api.post('/vehicle-records', payload)
                message.success('Kayıt oluşturuldu')
            }

            await loadData()
            form.resetFields()
            setEditing(null)
            setIsEditMode(false)
            setIsExitMode(false)
        } catch (e: any) {
            const serverMsg = e?.response?.data?.message
            const text = Array.isArray(serverMsg) ? serverMsg[0] : (serverMsg || 'Hata oluştu')
            message.error(text.toString())
        } finally {
            setLoading(false)
        }
    }

    const handleFilter = () => {
        loadData()
    }

    const exportExcel = () => {
        const headers = ['Plaka', 'Araç Durumu', 'Giriş Durumu', 'Çıkış Durumu', 'Giriş Tarihi', 'Çıkış Tarihi', 'Giriş/Çıkış Lokasyonu', 'Araç Türü', 'Not']
        const rows = items.map(v => [
            v.plate,
            v.vehicle_status || '',
            v.entry_at ? 'Evet' : 'Hayır',
            v.exit_at ? 'Evet' : 'Hayır',
            v.entry_at ? dayjs(v.entry_at).format('DD.MM.YYYY HH:mm') : '-',
            v.exit_at ? dayjs(v.exit_at).format('DD.MM.YYYY HH:mm') : '-',
            v.district || '',
            v.vehicle_type || '',
            v.note || '',
        ])
        const worksheet = `<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Araclar"><Table>${[headers, ...rows]
            .map(r => `<Row>${r.map(c => `<Cell><Data ss:Type="String">${(c ?? '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`).join('')}</Row>`)
            .join('')}</Table></Worksheet></Workbook>`
        const blob = new Blob([worksheet], { type: 'application/vnd.ms-excel' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `arac_kayitlari_${Date.now()}.xls`
        a.click()
        URL.revokeObjectURL(url)
    }

    const columns = useMemo(() => {
        const base: any[] = [
            {
                title: 'Plaka',
                dataIndex: 'plate',
                key: 'plate',
                sorter: true,
                sortOrder: sortKey === 'plate' ? sortOrder : null,
                render: (v: string) => <Text strong>{v}</Text>
            },
            {
                title: 'Araç Durumu',
                dataIndex: 'vehicle_status',
                key: 'vehicle_status',
                align: 'center' as const,
                render: (v: string | null) => (
                    v ? (
                        <span style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            backgroundColor: v === 'DOLU' ? '#e6f7ff' : '#fff7e6',
                            color: v === 'DOLU' ? '#1890ff' : '#fa8c16'
                        }}>
                            {v === 'DOLU' ? 'Dolu' : 'Boş'}
                        </span>
                    ) : '-'
                )
            },
            {
                title: 'Giriş Durumu',
                key: 'entryStatus',
                align: 'center' as const,
                render: (_: any, record: VehicleRecord) => (
                    record.entry_at ? (
                        <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
                    ) : (
                        <CloseCircleOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />
                    )
                )
            },
            {
                title: 'Çıkış Durumu',
                key: 'exitStatus',
                align: 'center' as const,
                render: (_: any, record: VehicleRecord) => (
                    record.exit_at ? (
                        <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
                    ) : (
                        <CloseCircleOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />
                    )
                )
            },
            {
                title: 'Giriş Tarihi',
                dataIndex: 'entry_at',
                key: 'entry_at',
                sorter: true,
                sortOrder: sortKey === 'entry_at' ? sortOrder : null,
                render: (v: string | null) => (
                    <Text type="secondary" style={{ fontFamily: 'monospace' }}>
                        {v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '-'}
                    </Text>
                )
            },
            {
                title: 'Çıkış Tarihi',
                dataIndex: 'exit_at',
                key: 'exit_at',
                sorter: true,
                sortOrder: sortKey === 'exit_at' ? sortOrder : null,
                render: (v: string | null) => (
                    <Text type="secondary" style={{ fontFamily: 'monospace' }}>
                        {v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '-'}
                    </Text>
                )
            },
            { title: 'Giriş/Çıkış Lokasyonu', dataIndex: 'district', key: 'district' },
            { title: 'Araç Türü', dataIndex: 'vehicle_type', key: 'vehicle_type' },
            {
                title: 'Not',
                dataIndex: 'note',
                key: 'note',
                render: (v: string | null) => (
                    <Text type="secondary" italic>{v || '-'}</Text>
                )
            },
            {
                title: 'İşlem',
                key: 'actions',
                align: 'center' as const,
                render: (_: any, record: VehicleRecord) => (
                    canFullEdit ? (
                        <Tooltip title="Düzenle">
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setEditing(record)
                                    setIsEditMode(true)
                                    setIsExitMode(false)
                                    form.setFieldsValue({
                                        plate: record.plate,
                                        entry_at: record.entry_at ? dayjs(record.entry_at) : undefined,
                                        exit_at: record.exit_at ? dayjs(record.exit_at) : undefined,
                                        district: record.district || undefined,
                                        vehicle_type: record.vehicle_type || undefined,
                                        vehicle_status: record.vehicle_status as FormValues['vehicle_status'] || undefined,
                                        note: record.note || undefined,
                                    })
                                }}
                            />
                        </Tooltip>
                    ) : null
                )
            },
        ]
        return base
    }, [sortKey, sortOrder, form])

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <CarOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                <Title level={3} style={{ margin: 0 }}>Araç Kayıt ve Takip</Title>
            </div>

            {/* Form Section */}
            <Card
                style={{ marginBottom: 24 }}
                styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.06)' } }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{isExitMode ? 'Çıkış Ekle' : (isEditMode ? 'Kayıt Düzenle' : 'Araç Giriş/Çıkış')}</span>
                        {(isEditMode || isExitMode || editing) && (
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={() => {
                                    setEditing(null)
                                    setIsEditMode(false)
                                    setIsExitMode(false)
                                    form.resetFields()
                                }}
                                size="small"
                            >
                                İptal
                            </Button>
                        )}
                    </div>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Row gutter={[24, 0]}>
                        <Col xs={24} sm={12} md={4}>
                            <Form.Item
                                label="Giriş Tarihi"
                                name="entry_at"
                                tooltip="İsteğe bağlı - en az bir tarih gerekli"
                            >
                                <DatePicker
                                    showTime
                                    style={{ width: '100%' }}
                                    format="DD.MM.YYYY HH:mm"
                                    placeholder="Tarih seçiniz"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Form.Item
                                label="Çıkış Tarihi"
                                name="exit_at"
                                tooltip="İsteğe bağlı - en az bir tarih gerekli"
                            >
                                <DatePicker
                                    showTime
                                    style={{ width: '100%' }}
                                    format="DD.MM.YYYY HH:mm"
                                    placeholder="Tarih seçiniz"
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Form.Item
                                label="Plaka"
                                name="plate"
                                rules={[
                                    { required: true, message: 'Plaka gerekli' },
                                    {
                                        validator: (_, value) => {
                                            const v = (value ?? '').toString().replace(/\s+/g, '').toUpperCase()
                                            return TR_PLATE_REGEX.test(v) ? Promise.resolve() : Promise.reject(new Error('Geçersiz plaka'))
                                        }
                                    }
                                ]}
                                getValueFromEvent={(e) => (e?.target?.value ?? '').toLocaleUpperCase('tr-TR')}
                            >
                                <Input placeholder="Örn: 34 ABC 1234" maxLength={12} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Form.Item
                                label="Araç Durumu"
                                name="vehicle_status"
                                rules={[{ required: !isExitMode, message: 'Araç durumu gerekli' }]}
                            >
                                <Select
                                    allowClear
                                    placeholder="Seçiniz"
                                    disabled={isExitMode}
                                    options={[
                                        { value: 'BOŞ', label: 'Boş' },
                                        { value: 'DOLU', label: 'Dolu' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Form.Item
                                label="Giriş/Çıkış Lokasyonu"
                                name="district"
                                rules={[{ required: true, message: 'Lokasyon gerekli' }]}
                            >
                                <Input placeholder="Lokasyon giriniz" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={4}>
                            <Form.Item
                                label="Araç Türü"
                                name="vehicle_type"
                                rules={[{ required: true, message: 'Araç türü gerekli' }]}
                            >
                                <Select
                                    allowClear
                                    placeholder="Seçiniz"
                                    options={[
                                        { value: 'BINEK', label: 'Binek' },
                                        { value: 'TICARI', label: 'Ticari' },
                                        { value: 'MOTOSIKLET', label: 'Motosiklet' },
                                        { value: 'SERVIS', label: 'Servis' },
                                        { value: 'DIGER', label: 'Diğer' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={[24, 0]}>
                        <Col xs={24} md={18}>
                            <Form.Item label="Not" name="note">
                                <Input.TextArea
                                    rows={1}
                                    placeholder="Notlar..."
                                    style={{ resize: 'none' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label=" " colon={false}>
                                <Button
                                    type="primary"
                                    icon={isEditMode ? <EditOutlined /> : <SaveOutlined />}
                                    onClick={submit}
                                    loading={loading}
                                    block
                                    style={{ backgroundColor: isEditMode ? '#1890ff' : '#52c41a', borderColor: isEditMode ? '#1890ff' : '#52c41a' }}
                                >
                                    {isEditMode ? 'Güncelle' : 'Kaydet'}
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* List Section */}
            <Card
                title={<Title level={5} style={{ margin: 0 }}>Araç Kayıtları</Title>}
                styles={{ body: { padding: 0 } }}
            >
                {/* Filters */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col>
                            <Space size={8}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Tarih:</Text>
                                <RangePicker
                                    allowEmpty={[true, true]}
                                    value={dateRange as any}
                                    onChange={(v) => setDateRange(v as any)}
                                    showTime={false}
                                    size="small"
                                    style={{ width: 240 }}
                                    placeholder={['Başlangıç', 'Bitiş']}
                                />
                            </Space>
                        </Col>
                        <Col>
                            <Space size={8}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Plaka:</Text>
                                <Input
                                    value={filterPlate}
                                    onChange={(e) => setFilterPlate(e.target.value)}
                                    allowClear
                                    placeholder="Plaka"
                                    size="small"
                                    style={{ width: 120 }}
                                />
                            </Space>
                        </Col>
                        <Col>
                            <Space size={8}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Araç Türü:</Text>
                                <Select
                                    value={filterVehicleType}
                                    onChange={setFilterVehicleType}
                                    allowClear
                                    placeholder="Tümü"
                                    size="small"
                                    style={{ width: 120 }}
                                    options={[
                                        { value: '', label: 'Tümü' },
                                        { value: 'BINEK', label: 'Binek' },
                                        { value: 'TICARI', label: 'Ticari' },
                                        { value: 'SERVIS', label: 'Servis' },
                                        { value: 'DIGER', label: 'Diğer' },
                                    ]}
                                />
                            </Space>
                        </Col>
                        <Col flex="auto" style={{ textAlign: 'right' }}>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<FilterOutlined />}
                                    onClick={handleFilter}
                                    loading={loading}
                                    size="small"
                                >
                                    Filtrele
                                </Button>
                                <Button
                                    icon={<FileExcelOutlined />}
                                    onClick={exportExcel}
                                    disabled={loading}
                                    size="small"
                                >
                                    Excel
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>

                {/* Table */}
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={items}
                    loading={loading}
                    pagination={{
                        pageSize,
                        current: page,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        showTotal: (t) => `Toplam ${t} kayıt`,
                        size: 'small'
                    }}
                    onChange={(_pagination, _filters, sorter: any) => {
                        setSortKey(sorter?.field || null)
                        setSortOrder(sorter?.order || null)
                        if (_pagination?.current) setPage(_pagination.current)
                        if (_pagination?.pageSize) setPageSize(_pagination.pageSize)
                    }}
                    onRow={(record) => ({
                        onClick: () => {
                            // Rol bazlı davranış
                            if (canFullEdit) {
                                // ADMIN/MANAGER: Full düzenleme
                                setEditing(record)
                                setIsEditMode(true)
                                setIsExitMode(false)
                                form.setFieldsValue({
                                    plate: record.plate,
                                    entry_at: record.entry_at ? dayjs(record.entry_at) : undefined,
                                    exit_at: record.exit_at ? dayjs(record.exit_at) : undefined,
                                    district: record.district || undefined,
                                    vehicle_type: record.vehicle_type || undefined,
                                    vehicle_status: record.vehicle_status as FormValues['vehicle_status'] || undefined,
                                    note: record.note || undefined,
                                })
                            } else if (canAddExit && record.entry_at && !record.exit_at) {
                                // OPERATOR: Sadece giriş kaydı varsa ve çıkış yoksa çıkış ekleme
                                setEditing(record)
                                setIsEditMode(false)
                                setIsExitMode(true)
                                form.setFieldsValue({
                                    plate: record.plate,
                                    entry_at: record.entry_at ? dayjs(record.entry_at) : undefined,
                                    exit_at: dayjs(),
                                    district: record.district || undefined,
                                    vehicle_type: record.vehicle_type || undefined,
                                    vehicle_status: record.vehicle_status as FormValues['vehicle_status'] || undefined,
                                    note: record.note || undefined,
                                })
                            } else if (record.exit_at) {
                                message.info('Bu kayıt için çıkış zaten yapılmış')
                            } else {
                                message.info('Bu işlem için yetkiniz yok')
                            }
                        },
                        style: {
                            cursor: (canFullEdit || (canAddExit && record.entry_at && !record.exit_at)) ? 'pointer' : 'default',
                            backgroundColor: editing?.id === record.id ? 'rgba(24, 144, 255, 0.1)' : undefined
                        }
                    })}
                    size="middle"
                />
            </Card>
        </div>
    )
}
