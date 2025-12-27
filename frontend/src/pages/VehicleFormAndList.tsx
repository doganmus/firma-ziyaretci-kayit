import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import {
    Form, Input, Button, Card, Typography, Table, Row, Col, Select,
    DatePicker, Space, message, Radio, Tooltip
} from 'antd'
import {
    SaveOutlined, EditOutlined, FilterOutlined, FileExcelOutlined,
    CarOutlined, CheckCircleFilled, CloseCircleOutlined
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

type FormValues = {
    plate: string
    district?: string
    vehicle_type?: string
    note?: string
    entry_at?: Dayjs
    exit_at?: Dayjs
}

type VehicleRecord = {
    id: string
    plate: string
    entry_at: string
    exit_at: string | null
    district?: string | null
    vehicle_type?: string | null
    note?: string | null
}

const TR_PLATE_REGEX = /^(0[1-9]|[1-7][0-9]|80|81)(?:[A-Z][0-9]{4,5}|[A-Z]{2}[0-9]{3,4}|[A-Z]{3}[0-9]{2,3})$/

export default function VehicleFormAndList() {
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<VehicleRecord[]>([])
    const [editing, setEditing] = useState<VehicleRecord | null>(null)
    const [formMode, setFormMode] = useState<'entry' | 'exit'>('entry')
    const [form] = Form.useForm<FormValues>()

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

            if (formMode === 'entry') {
                // Yeni giriş kaydı
                const payload = {
                    entry_at: values.entry_at ? dayjs(values.entry_at).toISOString() : dayjs().toISOString(),
                    plate: normalizedPlate,
                    district: values.district || null,
                    vehicle_type: values.vehicle_type || null,
                    note: values.note || null,
                }
                await api.post('/vehicle-records', payload)
                message.success('Giriş kaydı oluşturuldu')
            } else {
                // Çıkış kaydı ekle
                if (!editing) {
                    message.error('Çıkış eklemek için listeden bir kayıt seçin')
                    return
                }

                const exit_at = values.exit_at ? dayjs(values.exit_at).toISOString() : dayjs().toISOString()
                const entry_at = dayjs(editing.entry_at)

                // Frontend validasyonu: Çıkış tarihi giriş tarihinden sonra olmalı
                if (dayjs(exit_at).isBefore(entry_at) || dayjs(exit_at).isSame(entry_at)) {
                    message.error('Çıkış tarihi giriş tarihinden sonra olmalıdır')
                    return
                }

                await api.patch(`/vehicle-records/${editing.id}/exit`, { exit_at })
                message.success('Çıkış kaydedildi')
            }

            await loadData()
            form.resetFields()
            form.setFieldsValue({ entry_at: dayjs(), exit_at: dayjs() })
            setEditing(null)
            setFormMode('entry')
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
        const headers = ['Plaka', 'Giriş Durumu', 'Çıkış Durumu', 'Giriş Tarihi', 'Çıkış Tarihi', 'İlçe', 'Araç Türü', 'Not']
        const rows = items.map(v => [
            v.plate,
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
                render: (v: string) => (
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
            { title: 'İlçe', dataIndex: 'district', key: 'district' },
            { title: 'Araç Türü', dataIndex: 'vehicle_type', key: 'vehicle_type' },
            {
                title: 'Not',
                dataIndex: 'note',
                key: 'note',
                render: (v: string | null) => (
                    <Text type="secondary" italic>{v || '-'}</Text>
                )
            },
        ]
        return base
    }, [sortKey, sortOrder])

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
                    <Radio.Group
                        value={formMode}
                        onChange={(e) => {
                            setFormMode(e.target.value)
                            if (e.target.value === 'entry') {
                                setEditing(null)
                                form.resetFields()
                                form.setFieldsValue({ entry_at: dayjs() })
                            }
                        }}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="entry" style={{ backgroundColor: formMode === 'entry' ? '#52c41a' : undefined, borderColor: formMode === 'entry' ? '#52c41a' : undefined }}>
                            Yeni Giriş
                        </Radio.Button>
                        <Radio.Button value="exit" style={{ backgroundColor: formMode === 'exit' ? '#ff4d4f' : undefined, borderColor: formMode === 'exit' ? '#ff4d4f' : undefined }}>
                            Çıkış Ekle
                        </Radio.Button>
                    </Radio.Group>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ entry_at: dayjs(), exit_at: dayjs() }}
                >
                    {formMode === 'entry' ? (
                        <>
                            <Row gutter={[24, 0]}>
                                <Col xs={24} sm={12} md={6}>
                                    <Form.Item
                                        label="Giriş Tarihi"
                                        name="entry_at"
                                        rules={[{ required: true, message: 'Giriş tarihi gerekli' }]}
                                    >
                                        <DatePicker
                                            showTime
                                            style={{ width: '100%' }}
                                            format="DD.MM.YYYY HH:mm"
                                            placeholder="Tarih seçiniz"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
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
                                <Col xs={24} sm={12} md={6}>
                                    <Form.Item
                                        label="İlçe"
                                        name="district"
                                        rules={[{ required: true, message: 'İlçe gerekli' }]}
                                    >
                                        <Input placeholder="İlçe giriniz" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
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
                                            icon={<SaveOutlined />}
                                            onClick={submit}
                                            loading={loading}
                                            block
                                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                        >
                                            Giriş Kaydet
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </>
                    ) : (
                        <>
                            {editing ? (
                                <Row gutter={[24, 0]} align="middle">
                                    <Col xs={24} md={8}>
                                        <div style={{ marginBottom: 16 }}>
                                            <Text type="secondary">Seçili Kayıt:</Text>
                                            <div>
                                                <Text strong style={{ fontSize: 16 }}>{editing.plate}</Text>
                                                <Text type="secondary" style={{ marginLeft: 12 }}>
                                                    Giriş: {dayjs(editing.entry_at).format('DD.MM.YYYY HH:mm')}
                                                </Text>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item
                                            label="Çıkış Tarihi"
                                            name="exit_at"
                                            rules={[{ required: true, message: 'Çıkış tarihi gerekli' }]}
                                        >
                                            <DatePicker
                                                showTime
                                                style={{ width: '100%' }}
                                                format="DD.MM.YYYY HH:mm"
                                                placeholder="Çıkış tarihi seçiniz"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={8}>
                                        <Form.Item label=" " colon={false}>
                                            <Button
                                                type="primary"
                                                danger
                                                icon={<SaveOutlined />}
                                                onClick={submit}
                                                loading={loading}
                                                block
                                            >
                                                Çıkış Kaydet
                                            </Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>
                                    Çıkış eklemek için aşağıdaki listeden bir araç kaydı seçin
                                </div>
                            )}
                        </>
                    )}
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
                            if (!record.exit_at) {
                                // Sadece çıkış yapılmamış kayıtlar için çıkış modu
                                setEditing(record)
                                setFormMode('exit')
                                form.setFieldsValue({ exit_at: dayjs() })
                            } else {
                                message.info('Bu kayıt için çıkış zaten yapılmış')
                            }
                        },
                        style: {
                            cursor: record.exit_at ? 'default' : 'pointer',
                            backgroundColor: editing?.id === record.id ? 'rgba(24, 144, 255, 0.1)' : undefined
                        }
                    })}
                    size="middle"
                />
            </Card>
        </div>
    )
}
