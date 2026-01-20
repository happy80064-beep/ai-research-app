import { useLanguage } from "@/contexts/LanguageContext";
import { ReportCover } from "./ReportCover";

interface DeepReportData {
  reportTitle?: {
    mainTitle: string;
    subtitle: string;
  };

  chapter1: {
    title: string;
    subtitle?: string;
    background: string;
    objectives: string[];
    methodology: string;
  };
  chapter2: {
    title: string;
    profiles: Array<{
      name?: string;
      demographics?: string;
      background?: string;
      quote?: string;
      segment?: string;
      characteristics?: string[];
      preferences?: string[];
      painPoints?: string[];
    }>;
  };
  chapter3: {
    title: string;
    keyFindings: Array<{
      finding?: string;
      evidence?: string;
      userQuote?: string;
      title?: string;
      description?: string;
      confidence?: number;
    }>;
    jobStories: string[];
  };
  chapter4: {
    title: string;
    needs: string[];
    barriers: string[];
    trustFactors: string[];
  };
  chapter5: {
    title: string;
    priorities: Array<{
      priority: string;
      importance: number;
      urgency: number;
    }>;
    decisionProcess: string;
  };
  chapter6: {
    title: string;
    opportunities: Array<{
      opportunity: string;
      rationale: string;
      impact: string;
    }>;
    recommendations: Array<{
      action?: string;
      rationale: string;
      priority: string;
      recommendation?: string;
    }>;
  };
}

interface DeepReportViewProps {
  data: DeepReportData;
  reportDate: string;
  intervieweeCount: number;
  interviewCount: number;
}

export function DeepReportView({ data, reportDate, intervieweeCount, interviewCount }: DeepReportViewProps) {
  const { t } = useLanguage();

  if (!data) return null;

  return (
    <div className="deep-report-container">
      {/* Report Cover */}
      <ReportCover
        title={data.reportTitle?.mainTitle || data.chapter1?.title || "Deep Report"}
        reportDate={reportDate}
        intervieweeCount={intervieweeCount}
        interviewCount={interviewCount}
      />

      {/* Report Header */}
      <header className="report-header">
        <div className="report-meta">
          <span className="report-date">{reportDate}</span>
        </div>
        {data.reportTitle && typeof data.reportTitle === 'object' ? (
          <>
            <h1 className="report-title">{data.reportTitle.mainTitle}</h1>
            <p className="report-title-subtitle">{data.reportTitle.subtitle}</p>
          </>
        ) : (
          <h1 className="report-title">{data.reportTitle || data.chapter1?.title || "Research Report"}</h1>
        )}
        <p className="report-subtitle">{t('deepReport.subtitle')}</p>
      </header>

      {/* Chapter 1: Research Background & Objectives */}
      {data.chapter1 && (
      <section className="report-chapter">
        <h2 className="chapter-title">{data.chapter1.title}</h2>
        <div className="chapter-content">
          <div className="section-block">
            <h3 className="section-heading">{t('deepReport.background')}</h3>
            <p className="body-text">{data.chapter1.background}</p>
          </div>

          <div className="section-block">
            <h3 className="section-heading">{t('deepReport.objectives')}</h3>
            <ul className="objectives-list">
              {data.chapter1.objectives?.map((obj, idx) => (
                <li key={idx} className="objective-item">{obj}</li>
              ))}
            </ul>
          </div>

          <div className="section-block">
            <h3 className="section-heading">{t('deepReport.methodology')}</h3>
            <p className="body-text">{data.chapter1.methodology}</p>
          </div>
        </div>
      </section>
      )}

      {/* Chapter 2: Target Audience Profiles */}
      {data.chapter2 && (
      <section className="report-chapter">
        <h2 className="chapter-title">{data.chapter2.title}</h2>
        <div className="chapter-content">
          <div className="profiles-grid">
            {data.chapter2.profiles?.map((profile, idx) => (
              <div key={idx} className="profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">{(profile.name || profile.segment || 'P').charAt(0)}</div>
                  <div>
                    <h4 className="profile-name">{profile.name || profile.segment}</h4>
                    <p className="profile-demographics">{profile.demographics || profile.characteristics?.join(', ')}</p>
                  </div>
                </div>
                <p className="profile-background">{profile.background || profile.preferences?.join(', ')}</p>
                <blockquote className="profile-quote">
                  <p>"{profile.quote || profile.painPoints?.join(', ')}"</p>
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Chapter 3: Core Findings & Insights */}
      {data.chapter3 && (
      <section className="report-chapter">
        <h2 className="chapter-title">{data.chapter3.title}</h2>
        <div className="chapter-content">
          <div className="findings-list">
            {data.chapter3.keyFindings?.map((finding, idx) => (
              <div key={idx} className="finding-block">
                <div className="finding-number">{idx + 1}</div>
                <div className="finding-content">
                  <h4 className="finding-title">{finding.finding || finding.title}</h4>
                  <p className="finding-evidence">{finding.evidence || finding.description}</p>
                  {(finding.userQuote || finding.confidence) && (
                    <blockquote className="finding-quote">
                      <p>"{finding.userQuote || `Confidence: ${finding.confidence}`}"</p>
                    </blockquote>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.chapter3.jobStories && data.chapter3.jobStories.length > 0 && (
            <div className="section-block">
              <h3 className="section-heading">{t('deepReport.jobStories')}</h3>
              <div className="job-stories-list">
                {data.chapter3.jobStories.slice(0, 8).map((story, idx) => (
                  <div key={idx} className="job-story-item">
                    <span className="job-story-icon">→</span>
                    <p>{story}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Chapter 4: AI Tool Needs & Barriers */}
      {data.chapter4 && (
      <section className="report-chapter">
        <h2 className="chapter-title">{data.chapter4.title}</h2>
        <div className="chapter-content">
          <div className="three-column-grid">
            <div className="column-block">
              <h4 className="column-heading">{t('deepReport.needs')}</h4>
              <ul className="simple-list">
                {data.chapter4.needs?.map((need, idx) => (
                  <li key={idx}>{need}</li>
                ))}
              </ul>
            </div>
            <div className="column-block">
              <h4 className="column-heading">{t('deepReport.barriers')}</h4>
              <ul className="simple-list">
                {data.chapter4.barriers?.map((barrier, idx) => (
                  <li key={idx}>{barrier}</li>
                ))}
              </ul>
            </div>
            <div className="column-block">
              <h4 className="column-heading">{t('deepReport.trustFactors')}</h4>
              <ul className="simple-list">
                {data.chapter4.trustFactors?.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Chapter 5: Core Demands */}
      {data.chapter5 && (
      <section className="report-chapter">
        <h2 className="chapter-title">{data.chapter5.title}</h2>
        <div className="chapter-content">
          <div className="priority-matrix">
            {data.chapter5.priorities?.map((item, idx) => (
              <div key={idx} className="priority-item">
                <div className="priority-label">{item.priority}</div>
                <div className="priority-metrics">
                  <div className="metric">
                    <span className="metric-label">{t('deepReport.importance')}</span>
                    <span className="metric-value">{item.importance}/10</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">{t('deepReport.urgency')}</span>
                    <span className="metric-value">{item.urgency}/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-block">
            <h3 className="section-heading">{t('deepReport.decisionProcess')}</h3>
            <p className="body-text">{data.chapter5.decisionProcess}</p>
          </div>
        </div>
      </section>
      )}

      {/* Chapter 6: Business Opportunities & Recommendations */}
      {data.chapter6 && (
      <section className="report-chapter">
        <h2 className="chapter-title">{data.chapter6.title}</h2>
        <div className="chapter-content">
          <div className="section-block">
            <h3 className="section-heading">{t('deepReport.opportunities')}</h3>
            <div className="opportunities-list">
              {data.chapter6.opportunities?.map((opp, idx) => (
                <div key={idx} className="opportunity-block">
                  <h4 className="opportunity-title">{opp.opportunity}</h4>
                  <p className="opportunity-rationale">{opp.rationale}</p>
                  <div className="opportunity-impact">
                    <span className="impact-label">{t('deepReport.impact')}:</span>
                    <span className="impact-value">{opp.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-block">
            <h3 className="section-heading">{t('deepReport.recommendations')}</h3>
            <div className="recommendations-list">
              {data.chapter6.recommendations?.map((rec, idx) => (
                <div key={idx} className="recommendation-block">
                  <div className="recommendation-header">
                    <span className="recommendation-number">{idx + 1}</span>
                    <span className={`recommendation-priority priority-${rec.priority?.toLowerCase()}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <h4 className="recommendation-action">{rec.action || rec.recommendation}</h4>
                  <p className="recommendation-rationale">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}



      {/* Report Footer */}
      <footer className="report-footer">
        <p className="footer-text">{t('deepReport.footer')}</p>
      </footer>
    </div>
  );
}
