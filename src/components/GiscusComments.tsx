interface GiscusCommentsProps {
  agentId: string;
}

/**
 * Embeds GitHub Discussions as comments via giscus.
 * Configure your repo's Discussions and update the props below.
 * See: https://giscus.app for setup instructions.
 */
export default function GiscusComments({ agentId }: GiscusCommentsProps) {
  const repo = import.meta.env.VITE_GISCUS_REPO || '';
  const repoId = import.meta.env.VITE_GISCUS_REPO_ID || '';
  const categoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID || '';

  if (!repo || !repoId || !categoryId) {
    return (
      <div className="giscus-placeholder">
        <p>Discussions are not configured yet.</p>
        <p className="giscus-hint">
          Set up <a href="https://giscus.app" target="_blank" rel="noopener noreferrer">giscus</a> and
          add VITE_GISCUS_REPO, VITE_GISCUS_REPO_ID, and VITE_GISCUS_CATEGORY_ID to your environment.
        </p>
      </div>
    );
  }

  return (
    <div className="giscus-wrapper" key={agentId}>
      <script
        src="https://giscus.app/client.js"
        data-repo={repo}
        data-repo-id={repoId}
        data-category="Agent Discussions"
        data-category-id={categoryId}
        data-mapping="specific"
        data-term={agentId}
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="dark_dimmed"
        data-lang="en"
        data-loading="lazy"
        crossOrigin="anonymous"
        async
      />
    </div>
  );
}
