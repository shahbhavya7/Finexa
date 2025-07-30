import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Dummy data for preview
const PREVIEW_DATA = {
  monthlyReport: {
    userName: "John Doe",
    type: "monthly-report",
    data: {
      month: "December",
      stats: {
        totalIncome: 5000,
        totalExpenses: 3500,
        byCategory: {
          housing: 1500,
          groceries: 600,
          transportation: 400,
          entertainment: 300,
          utilities: 700,
        },
      },
      insights: [
        "Your housing expenses are 43% of your total spending - consider reviewing your housing costs.",
        "Great job keeping entertainment expenses under control this month!",
        "Setting up automatic savings could help you save 20% more of your income.",
      ],
    },
  },
  budgetAlert: {
    userName: "John Doe",
    type: "budget-alert",
    data: {
      percentageUsed: 85,
      budgetAmount: 4000,
      totalExpenses: 3400,
    },
  },
};

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  const formatNumber = (num) =>
    typeof num === "number" ? `₹${num.toFixed(2)}` : "₹0.00";
  if (type === "monthly-report") {
    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            {/* Header */}
            <Section style={styles.header}>
              <Heading style={styles.title}>Monthly Financial Report</Heading>
              <Text style={styles.subtitle}>{data?.month} Summary</Text>
            </Section>

            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Here’s your financial summary for {data?.month}:
            </Text>

            {/* Main Stats */}
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Total Income</Text>
                <Text style={styles.statValue}>
                  {formatNumber(data?.stats?.totalIncome)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Total Expenses</Text>
                <Text style={styles.statValue}>
                  {formatNumber(data?.stats?.totalExpenses)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.statLabel}>Net</Text>
                <Text style={styles.statValue}>
                  {formatNumber(
                    (data?.stats?.totalIncome || 0) -
                      (data?.stats?.totalExpenses || 0)
                  )}
                </Text>
              </div>
            </Section>

            {/* Category Breakdown */}
            {data?.stats?.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.sectionTitle}>
                  Expenses by Category
                </Heading>
                {Object.entries(data.stats.byCategory).map(
                  ([category, amount]) => (
                    <div key={category} style={styles.row}>
                      <Text style={styles.categoryLabel}>{category}: </Text>
                      <Text style={styles.categoryValue}>
                        {formatNumber(amount)}
                      </Text>
                    </div>
                  )
                )}
              </Section>
            )}

            {/* AI Insights */}
            {data?.insights && (
              <Section style={styles.section}>
                <Heading style={styles.sectionTitle}>Finexa Insights</Heading>
                {data.insights.map((insight, index) => (
                  <Text key={index} style={styles.insight}>
                    • {insight}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Thank you for using <b>Finexa</b>. Keep tracking your finances for
              better financial health!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
  const formatNumber = (num) =>
    typeof num === "number" ? `₹${num.toFixed(2)}` : "₹0.00";

  return (
    <Html>
      <Head />
      <Preview>Budget Alert</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.title}>Budget Alert</Heading>
            <Text style={styles.subtitle}>Spending Overview</Text>
          </Section>

          <Text style={styles.text}>Hello {userName},</Text>
          <Text style={styles.text}>
            You’ve used {data?.percentageUsed?.toFixed(1) || 0}% of your monthly budget.
          </Text>

          {/* Stats */}
          <Section style={styles.statsContainer}>
            <div style={styles.stat}>
              <Text style={styles.statLabel}>Budget Amount</Text>
              <Text style={styles.statValue}>
                {formatNumber(data?.budgetAmount)}
              </Text>
            </div>
            <div style={styles.stat}>
              <Text style={styles.statLabel}>Spent So Far</Text>
              <Text style={styles.statValue}>
                {formatNumber(data?.totalExpenses)}
              </Text>
            </div>
            <div style={styles.stat}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statValue}>
                {formatNumber(
                  (data?.budgetAmount || 0) - (data?.totalExpenses || 0)
                )}
              </Text>
            </div>
          </Section>

          <Text style={styles.footer}>
            Stay on track and keep your spending under control.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

}

const styles = {
  body: {
    backgroundColor: "#E6F7FA",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    maxWidth: "600px",
  },
  header: {
    background: "linear-gradient(to right, #00BCD4, #0288D1)",
    padding: "20px",
    borderRadius: "8px 8px 0 0",
    textAlign: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0",
  },
  subtitle: {
    color: "#b2ebf2",
    fontSize: "14px",
    margin: "4px 0 0 0",
  },
  text: {
    color: "#004d61",
    fontSize: "16px",
    margin: "16px 0",
  },
  statsContainer: {
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "#F0FCFF",
    borderRadius: "6px",
    border: "1px solid #B2EBF2",
  },
  stat: {
    marginBottom: "12px",
  },
  statLabel: {
    color: "#0097A7",
    fontSize: "14px",
  },
  statValue: {
    color: "#006064",
    fontSize: "20px",
    fontWeight: "bold",
  },
  section: {
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "#F0FCFF",
    borderRadius: "6px",
    border: "1px solid #B2EBF2",
  },
  sectionTitle: {
    color: "#006064",
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "12px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid #B2EBF2",
  },
  categoryLabel: {
    color: "#004d61",
  },
  categoryValue: {
    color: "#004d61",
    fontWeight: "500",
  },
  insight: {
    color: "#006064",
    fontSize: "14px",
    marginBottom: "8px",
  },
  footer: {
    color: "#00796B",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "24px",
    paddingTop: "12px",
    borderTop: "1px solid #B2EBF2",
  },
};