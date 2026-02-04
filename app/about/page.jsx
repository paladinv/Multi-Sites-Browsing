export const metadata = {
  title: "About MSB",
};

export default function AboutPage() {
  return (
    <div className="about">
      <h1>About MSB</h1>
      <p>
        MSB (Multi-Sites Browsing) is built for people who need to monitor multiple web pages at the same time.
        The app starts by letting you choose a split from two to four vertical panels, then each panel can
        navigate to its own web address. When you close a panel, the remaining panels reload and reflow to
        keep your workspace aligned.
      </p>
      <p>
        MSB is open source under the GNU GPL v3.0 license. That means you are free to study, modify, and share
        the software as long as derived works remain under the same license. If you deploy MSB publicly, be sure
        to include attribution and license details.
      </p>
      <p>
        The project is structured to work well on GitHub and deploys cleanly to Vercel using standard Next.js
        workflows.
      </p>
    </div>
  );
}
