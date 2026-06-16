import FileTree from "./FileTree.jsx";
import LanguageChart from "./LanguageChart.jsx";

function ResultList({ items }) {
  if (!items?.length) {
    return <p className="muted">Nothing notable found.</p>;
  }

  return (
    <ul className="result-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

function ResultSection({ title, children }) {
  return (
    <section className="result-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ResultGroup({ title, children }) {
  return (
    <section className="result-group">
      <h3>{title}</h3>
      <div className="result-group-body">{children}</div>
    </section>
  );
}

function ResultItem({ title, children }) {
  return (
    <div className="result-item">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

export default function AnalysisResult({ analysis }) {
  if (!analysis) {
    return null;
  }

  const result = analysis.geminiResult || {};
  const isIncomplete = result.analysisStatus === "failed" || result.analysisStatus === "busy";
  const issuesAndSecurity = [
    ...(result.issues || []).map((item) => `Issue: ${item}`),
    ...(result.securityConcerns || []).map((item) => `Security: ${item}`)
  ];

  if (isIncomplete) {
    const isBusy = result.analysisStatus === "busy";

    return (
      <div className="analysis-card">
        <div className="analysis-header">
          <div>
            <p className="eyebrow">{isBusy ? "Analysis busy" : "Analysis incomplete"}</p>
            <h2>{analysis.projectName || "Uploaded Project"}</h2>
          </div>
          <div className="summary-pills">
            <span>{analysis.fileCount} files</span>
          </div>
        </div>

        <ResultSection title="Analysis Status">
          <p>
            {result.summary ||
              (isBusy
                ? "Analysis is busy right now. Please try again in a moment."
                : "Analysis failed. Please try again.")}
          </p>
        </ResultSection>

        <ResultSection title="Uploaded Files">
          <p>{result.structureNotes || "Your files were uploaded and scanned."}</p>
          <FileTree tree={analysis.fileTree} />
        </ResultSection>

        <ResultSection title="Language Percentages">
          <LanguageChart stats={analysis.languageStats} />
        </ResultSection>

        {analysis.skippedFiles?.length > 0 && (
          <ResultSection title="Skipped Files">
            <ResultList
              items={analysis.skippedFiles.map((file) => `${file.path}: ${file.reason}`)}
            />
          </ResultSection>
        )}
      </div>
    );
  }

  return (
    <div className="analysis-card">
      <div className="analysis-header">
        <div>
          <p className="eyebrow">Analysis complete</p>
          <h2>{analysis.projectName || "Uploaded Project"}</h2>
        </div>
        <div className="summary-pills">
          <span>{analysis.fileCount} files</span>
        </div>
      </div>

      <ResultGroup title="Brief Overview">
        <ResultItem title="Summary">
          <p>{result.summary || "No summary was returned."}</p>
        </ResultItem>

        <ResultItem title="Purpose">
          <p>{result.purpose || "No purpose was returned."}</p>
        </ResultItem>

        <ResultItem title="ELI5">
          <p>{result.beginnerExplanation || "No beginner explanation was returned."}</p>
        </ResultItem>
      </ResultGroup>

      <ResultGroup title="In Depth">
        <ResultItem title="Uploaded Files">
          <p>{result.structureNotes || "The uploaded files are shown below."}</p>
          <FileTree tree={analysis.fileTree} />
        </ResultItem>

        <ResultItem title="Language Percentages">
          <LanguageChart stats={analysis.languageStats} />
        </ResultItem>

        <ResultItem title="Overview">
          <p>{result.overviewParagraph || result.summary || "No overview was returned."}</p>
        </ResultItem>

        <ResultItem title="Code Quality Notes">
          <ResultList items={result.qualityNotes} />
        </ResultItem>

        <ResultItem title="Potential Issues + Security Concerns">
          <ResultList items={issuesAndSecurity} />
        </ResultItem>

        <ResultItem title="Possible Improvements">
          <ResultList items={result.improvements} />
        </ResultItem>
      </ResultGroup>

      {result.rawText && (
        <ResultSection title="Raw Gemini Response">
          <pre className="raw-response">{result.rawText}</pre>
        </ResultSection>
      )}

      {analysis.skippedFiles?.length > 0 && (
        <ResultSection title="Skipped Files">
          <ResultList
            items={analysis.skippedFiles.map((file) => `${file.path}: ${file.reason}`)}
          />
        </ResultSection>
      )}
    </div>
  );
}
