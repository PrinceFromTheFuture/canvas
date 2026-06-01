export default function Report() {
  const [activeTab, setActiveTab] = useCanvasState("activeTab", "overview");
  const [todos, setTodos] = useCanvasState("todos", [
    { id: "t1", content: "Review Q3 infrastructure costs", status: "completed" },
    { id: "t2", content: "Update service dependency diagram", status: "in_progress" },
    { id: "t3", content: "Migrate legacy auth service", status: "pending" },
    { id: "t4", content: "Run penetration test on API gateway", status: "completed" },
  ]);
  const [showDetails, setShowDetails] = useCanvasState("showDetails", true);
  const [searchVal, setSearchVal] = useCanvasState("searchVal", "");
  const theme = useHostTheme();

  return (
    <ReportRoot>
      <Stack gap={24}>
        {/* ========== PAGE TITLE ========== */}
        <H1 style={{ marginBottom: 0 }}>Platform Infrastructure Report</H1>
        <Text size="small" tone="tertiary" style={{ marginTop: -12 }}>
          Generated 14 Oct 2025 · Source: internal metrics · Time range: last 30 days
        </Text>

        <Divider />

        {/* ========== STAT STRIP ========== */}
        <Grid columns={4} gap={16}>
          <Stat value="$284K" label="Monthly Cost" tone="info" />
          <Stat value="99.94%" label="Uptime (p99)" tone="success" />
          <Stat value="1,423" label="Services Deployed" tone="neutral" />
          <Stat value="12s" label="Avg Deploy Time" tone="warning" />
        </Grid>

        <Divider />

        {/* ========== TAB BAR ========== */}
        <Row gap={4}>
          {["overview", "services", "costs", "audit"].map((tab) => (
            <Pill
              key={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              tone={activeTab === tab ? "info" : "neutral"}
              size="sm"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Pill>
          ))}
          <Spacer />
          <DiffStats additions={23} deletions={7} />
        </Row>

        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === "overview" && (
          <Stack gap={24}>
            {/* --- Resource Usage Bar --- */}
            <Card>
              <CardHeader trailing={<Text size="small" tone="tertiary">of 1,024 vCPU</Text>}>
                Compute Capacity
              </CardHeader>
              <CardBody>
                <UsageBar
                  segments={[
                    { id: "prod", value: 420, color: "blue" },
                    { id: "staging", value: 128, color: "purple" },
                    { id: "dev", value: 64, color: "green" },
                  ]}
                  total={1024}
                  topLeftLabel={<Text size="small" weight="medium">Allocated</Text>}
                  topRightLabel={<Text size="small" tone="secondary">612 vCPU (60%)</Text>}
                />
              </CardBody>
            </Card>

            {/* --- Callout --- */}
            <Callout tone="warning" title="Deprecation Notice">
              Service <Code>auth-legacy-v2</Code> will be decommissioned on 1 Nov. Migrate
              all consumers to <Code>auth-service</Code> before the cutoff.
            </Callout>

            {/* --- Bar Chart --- */}
            <Stack gap={8}>
              <H2>API Error Rate by Service</H2>
              <Text size="small" tone="tertiary">Errors per 1,000 requests — last 7 days</Text>
              <BarChart
                categories={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                series={[
                  { name: "api-gateway", data: [3, 5, 2, 4, 1, 0, 2], tone: "success" },
                  { name: "payment-service", data: [12, 8, 15, 7, 10, 6, 9], tone: "warning" },
                  { name: "search-service", data: [1, 0, 2, 1, 0, 0, 1], tone: "info" },
                ]}
                height={200}
              />
            </Stack>

            {/* --- Line Chart --- */}
            <Stack gap={8}>
              <H2>P95 Latency (ms) — Last 30 Days</H2>
              <Text size="small" tone="tertiary">Rolling 7-day average</Text>
              <LineChart
                categories={["W1", "W2", "W3", "W4"]}
                series={[
                  { name: "api-gateway", data: [42, 38, 45, 39], tone: "success" },
                  { name: "payment-service", data: [128, 145, 132, 118], tone: "warning" },
                  { name: "user-service", data: [64, 71, 58, 62], tone: "info" },
                ]}
                height={200}
                fill
              />
            </Stack>

            {/* --- Pie Chart --- */}
            <Stack gap={8}>
              <H2>Cost Breakdown by Service</H2>
              <Text size="small" tone="tertiary">% of total monthly spend</Text>
              <PieChart
                data={[
                  { label: "api-gateway", value: 34, tone: "success" },
                  { label: "payment-service", value: 28, tone: "warning" },
                  { label: "user-service", value: 18, tone: "info" },
                  { label: "notification-service", value: 12, tone: "neutral" },
                  { label: "search-service", value: 8, tone: "danger" },
                ]}
                donut
                size={220}
              />
            </Stack>

            {/* --- Todo List Card --- */}
            <TodoListCard
              todos={todos}
              defaultExpanded
            />

            {/* --- Collapsible Section (nested) --- */}
            <CollapsibleSection
              title="Incident Log"
              count={3}
              leading={<Swatch color="yellow" />}
            >
              <Stack gap={12} style={{ paddingTop: 8 }}>
                <CollapsibleSection title="2025-10-12 — Payment timeout spike" count={2}>
                  <Text size="small">
                    Root cause: connection pool exhaustion in <Code>payment-db-primary</Code>.
                    Auto-scaler reconfigured — pool max doubled to 200.
                  </Text>
                </CollapsibleSection>
                <CollapsibleSection title="2025-10-08 — Search index drift">
                  <Text size="small">
                    Reindex job failed due to OOM. Memory limit raised to 4 GB; alert threshold added.
                  </Text>
                </CollapsibleSection>
                <CollapsibleSection title="2025-10-01 — TLS cert expiry">
                  <Text size="small">
                    Three certs expired in staging. Automation now renews 14 days before expiry.
                  </Text>
                </CollapsibleSection>
              </Stack>
            </CollapsibleSection>
          </Stack>
        )}

        {/* ========== SERVICES TAB ========== */}
        {activeTab === "services" && (
          <Stack gap={24}>
            <H2>Service Inventory</H2>
            <Text size="small" tone="tertiary">All 5 core services · Status as of last health check</Text>

            <Table
              headers={["Service", "Version", "Status", "Uptime", "Deployments"]}
              rows={[
                ["api-gateway", "v4.2.1", <Pill tone="success" size="sm">Healthy</Pill>, "99.98%", "214"],
                ["user-service", "v3.8.0", <Pill tone="info" size="sm">Degraded</Pill>, "99.82%", "187"],
                ["payment-service", "v5.1.3", <Pill tone="warning" size="sm">At Risk</Pill>, "98.41%", "96"],
                ["notification-service", "v2.4.7", <Pill tone="success" size="sm">Healthy</Pill>, "99.95%", "302"],
                ["search-service", "v1.9.2", <Pill tone="neutral" size="sm">Unknown</Pill>, "—", "55"],
              ]}
              columnAlign={["left", "center", "center", "center", "center"]}
              rowTone={["success", "info", "warning", "success", "neutral"]}
              striped
              stickyHeader
            />

            {/* --- Sections (accordion) --- */}
            <H2>Service Details</H2>
            <Sections
              items={[
                {
                  title: "api-gateway · v4.2.1",
                  body: (
                    <Stack gap={8}>
                      <Text size="small">Handles 12K req/s at peak. Rate limiting enabled per tenant.</Text>
                      <Row gap={8}>
                        <Pill tone="success" size="sm">L4 Load Balancer</Pill>
                        <Pill tone="success" size="sm">WAF Active</Pill>
                        <Pill tone="info" size="sm">Canary Deploy</Pill>
                      </Row>
                    </Stack>
                  ),
                },
                {
                  title: "payment-service · v5.1.3",
                  body: (
                    <Stack gap={8}>
                      <Text size="small">PCI DSS compliant. 3DS v2 enforced. Recent P95 latency increase under investigation.</Text>
                      <Row gap={8}>
                        <Pill tone="warning" size="sm">Degraded</Pill>
                        <Pill tone="neutral" size="sm">PCI Scope</Pill>
                      </Row>
                    </Stack>
                  ),
                },
                {
                  title: "notification-service · v2.4.7",
                  body: (
                    <Stack gap={8}>
                      <Text size="small">Email, SMS, and push channels. 99.95% delivery rate within 5s.</Text>
                      <Row gap={8}>
                        <Pill tone="success" size="sm">Active</Pill>
                        <Pill tone="info" size="sm">Multi-region</Pill>
                      </Row>
                    </Stack>
                  ),
                },
              ]}
            />

            {/* --- Card with collapsible + trailing content --- */}
            <Card collapsible defaultOpen>
              <CardHeader trailing={<Code>docs/latest</Code>}>
                Architecture Notes
              </CardHeader>
              <CardBody>
                <Text size="small">
                  All services connect via a shared service mesh (Istio). mTLS is enforced
                  between every pod. Traffic to <Code>payment-service</Code> is pinned to a
                  dedicated node pool for compliance isolation.
                </Text>
              </CardBody>
            </Card>
          </Stack>
        )}

        {/* ========== COSTS TAB ========== */}
        {activeTab === "costs" && (
          <Stack gap={24}>
            <H2>Cost Breakdown</H2>
            <Text size="small" tone="tertiary">Monthly spend by resource category</Text>

            <Grid columns={3} gap={16}>
              <Card variant="borderless">
                <CardBody>
                  <Stat value="$142K" label="Compute" tone="info" />
                </CardBody>
              </Card>
              <Card variant="borderless">
                <CardBody>
                  <Stat value="$68K" label="Storage" tone="warning" />
                </CardBody>
              </Card>
              <Card variant="borderless">
                <CardBody>
                  <Stat value="$74K" label="Networking" tone="success" />
                </CardBody>
              </Card>
            </Grid>

            <BarChart
              categories={["Compute", "Storage", "Networking", "Database", "Other"]}
              series={[
                { name: "Production", data: [82, 38, 44, 51, 18], tone: "success" },
                { name: "Staging", data: [36, 18, 20, 14, 7], tone: "info" },
                { name: "Dev", data: [24, 12, 10, 8, 5], tone: "neutral" },
              ]}
              stacked
              height={220}
              valueSuffix="K"
            />

            <Callout tone="info" title="Savings Opportunity">
              Right-sizing unused dev instances could save ~$8.4K/mo. See
              <Link href="https://example.com/recommendations">recommendations detail</Link>.
            </Callout>

            {/* --- Diff example --- */}
            <Card>
              <CardHeader trailing={<DiffStats additions={12} deletions={3} />}>
                Recent Cost Policy Change
              </CardHeader>
              <CardBody style={{ padding: 0 }}>
                <DiffView
                  lines={[
                    { type: "unchanged", content: "  budget:\n    max: 320000\n    alert_at: 280000", lineNumber: 1 },
                    { type: "removed", content: "    notify_channels: [\"slack-cost-alerts\"]", lineNumber: 2 },
                    { type: "added", content: "    notify_channels: [\"slack-cost-alerts\", \"pagerduty-cost\"]", lineNumber: 3 },
                    { type: "added", content: "    auto_remediate: true", lineNumber: 4 },
                    { type: "unchanged", content: "    grace_period_days: 3", lineNumber: 5 },
                  ]}
                  showLineNumbers
                  coloredLineNumbers
                  showAccentStrip
                />
              </CardBody>
            </Card>
          </Stack>
        )}

        {/* ========== AUDIT TAB ========== */}
        {activeTab === "audit" && (
          <Stack gap={24}>
            <H2>Compliance & Audit Trail</H2>

            {/* --- Search + toggle example --- */}
            <Row gap={12} align="center" wrap>
              <TextInput
                value={searchVal}
                onChange={setSearchVal}
                placeholder="Filter by service or user…"
                style={{ minWidth: 280 }}
              />
              <Checkbox
                checked={showDetails}
                onChange={setShowDetails}
                label="Show details"
              />
              <Toggle
                checked={showDetails}
                onChange={setShowDetails}
                size="sm"
              />
              <Select
                value="all"
                options={[
                  { value: "all", label: "All events" },
                  { value: "config", label: "Config changes" },
                  { value: "deploy", label: "Deployments" },
                ]}
              />
            </Row>

            <Table
              headers={["Timestamp", "Actor", "Action", "Resource", "Status"]}
              rows={[
                ["14 Oct 09:12", "deploy-bot", "deploy", "payment-service:v5.1.3", <Pill tone="success" size="sm">Success</Pill>],
                ["13 Oct 17:45", "jane.doe", "config update", "api-gateway/rate-limit", <Pill tone="warning" size="sm">Review</Pill>],
                ["12 Oct 06:30", "auto-scaler", "scale up", "payment-service (8→12 pods)", <Pill tone="info" size="sm">Auto</Pill>],
                ["11 Oct 22:15", "john.smith", "rollback", "user-service:v3.7.9", <Pill tone="danger" size="sm">Failed</Pill>],
                ["10 Oct 14:00", "cert-bot", "renew", "api-gateway TLS cert", <Pill tone="success" size="sm">Success</Pill>],
              ]}
              columnAlign={["left", "left", "left", "left", "center"]}
              striped
              stickyHeader
            />

            {/* --- Text area example --- */}
            <Stack gap={8}>
              <Text weight="semibold">Audit Notes</Text>
              <TextArea
                value="Reviewed by compliance team on 14 Oct. All findings documented in INC-8923."
                onChange={() => {}}
                rows={3}
              />
            </Stack>

            {/* --- Button + IconButton + Link demo --- */}
            <Row gap={8}>
              <Button variant="primary" onClick={() => {}}>Run New Audit</Button>
              <Button variant="secondary" onClick={() => {}}>Export Report</Button>
              <Button variant="ghost" onClick={() => {}}>Dismiss</Button>
              <IconButton title="Refresh" onClick={() => {}}>↻</IconButton>
              <IconButton title="Settings" variant="circle" size="sm">⚙</IconButton>
              <Link href="https://example.com/audit-log">View full audit log →</Link>
            </Row>

            {/* --- Nested Card with trailing icon --- */}
            <Card variant="borderless">
              <CardHeader trailing={<Code>auditd</Code>}>
                Last System Scan
              </CardHeader>
              <CardBody>
                <Text size="small">
                  All services passed the <Text weight="semibold">CIS Benchmark v2.0</Text> check.
                  Notable finding: <Code>/var/log/audit</Code> retention set to 90 days (above
                  the 30-day minimum).
                </Text>
              </CardBody>
            </Card>

            {/* --- Swatch samples --- */}
            <Row gap={8} align="center" wrap>
              <Text size="small" weight="medium" tone="secondary">Category:</Text>
              <Swatch color="gray" />
              <Text size="small" tone="secondary">Gray</Text>
              <Swatch color="purple" />
              <Text size="small" tone="secondary">Purple</Text>
              <Swatch color="green" />
              <Text size="small" tone="secondary">Green</Text>
              <Swatch color="yellow" />
              <Text size="small" tone="secondary">Yellow</Text>
              <Swatch color="pink" />
              <Text size="small" tone="secondary">Pink</Text>
              <Swatch color="blue" />
              <Text size="small" tone="secondary">Blue</Text>
              <Swatch color="orange" />
              <Text size="small" tone="secondary">Orange</Text>
            </Row>
          </Stack>
        )}

        {/* ========== FOOTER ========== */}
        <Divider />
        <Row gap={16} align="center">
          <Text size="small" tone="tertiary">
            Built with the Canvas Report SDK · All data is synthetic for demonstration
          </Text>
          <Spacer />
          <Text size="small" italic tone="tertiary">Report v1.3</Text>
        </Row>
      </Stack>
    </ReportRoot>
  );
}