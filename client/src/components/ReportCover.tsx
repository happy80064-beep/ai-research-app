import { useLanguage } from "@/contexts/LanguageContext";

interface ReportCoverProps {
  title: {
    mainTitle: string;
    subtitle: string;
  } | string;
  reportDate: string;
  intervieweeCount: number;
  interviewCount: number;
}

export function ReportCover({
  title,
  reportDate,
  intervieweeCount,
  interviewCount,
}: ReportCoverProps) {
  const { t } = useLanguage();

  return (
    <div className="report-cover">
      {/* Top Label */}
      <div className="cover-label">
        <span className="cover-label-text">{t("deepInsightReport")}</span>
      </div>

      {/* Main Title */}
      <div className="cover-title-section">
        {typeof title === 'string' ? (
          <h1 className="cover-main-title">{title}</h1>
        ) : (
          <>
            <h1 className="cover-main-title">{title.mainTitle}</h1>
            <p className="cover-subtitle">{title.subtitle}</p>
          </>
        )}
      </div>

      {/* Research Metadata */}
      <div className="cover-metadata">
        <div className="metadata-grid">
          <div className="metadata-item">
            <div className="metadata-label">{t("reportDate")}</div>
            <div className="metadata-value">{reportDate}</div>
          </div>
          <div className="metadata-item">
            <div className="metadata-label">{t("interviewees")}</div>
            <div className="metadata-value">{intervieweeCount}</div>
          </div>
          <div className="metadata-item">
            <div className="metadata-label">{t("interviews")}</div>
            <div className="metadata-value">{interviewCount}</div>
          </div>
        </div>
      </div>


    </div>
  );
}
