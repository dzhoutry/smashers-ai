import './ScoringRubric.css';

const rubricData = [
    {
        score: '1-2',
        tier: 'Beginner',
        technical: 'Basic grip/hit. Often misses shuttle. Limited stroke variety.',
        tactical: 'No real strategy. Struggles with court positioning.',
        physicality: 'Low stamina. Slow reaction. Limited lunge range.'
    },
    {
        score: '3-4',
        tier: 'Novice',
        technical: 'Consistent clears/serves. Basic drops. Technique is rigid or lacks power.',
        tactical: 'Can sustain short rallies. Basic understanding of gaps.',
        physicality: 'Moderate court coverage. Gets tired during long rallies.'
    },
    {
        score: '5-6',
        tier: 'Intermediate',
        technical: 'Reliable stroke mechanics. Developing net play and smashes.',
        tactical: 'Intentional shot placement. Basic pattern recognition.',
        physicality: 'Good footwork efficiency. Maintains speed throughout a set.'
    },
    {
        score: '7-8',
        tier: 'Advanced',
        technical: 'Strong power and precision. High-quality deceptive shots.',
        tactical: 'Exploits opponent weaknesses. Strong anticipation.',
        physicality: 'Explosive first step. High endurance and recovery speed.'
    },
    {
        score: '9-10',
        tier: 'Professional',
        technical: 'International level precision. Flawless footwork and racket speed.',
        tactical: 'Master of rally construction. Near-perfect anticipation.',
        physicality: 'Elite athleticism. Extreme lunge stability and power.'
    }
];

function ScoringRubric({ onClose }) {
    return (
        <div className="rubric-overlay" onClick={onClose}>
            <div className="rubric-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rubric-header">
                    <h2 className="rubric-title">SCORING RUBRIC</h2>
                    <button className="close-btn-square" onClick={onClose}>&times;</button>
                </div>
                <div className="rubric-content">
                    <div className="rubric-intro">
                        <div className="intro-line"></div>
                        <p>
                            Our AI analyzes your performance based on 100+ data points across three core pillars.
                            The Overall Score is a weighted calculation: <span className="weight-tag">40% Technical</span>, <span className="weight-tag">40% Tactical</span>, and <span className="weight-tag">20% Physicality</span>.
                        </p>
                    </div>

                    <div className="rubric-table-wrapper">
                        <table className="rubric-table">
                            <thead>
                                <tr>
                                    <th>SCORE</th>
                                    <th>TIER</th>
                                    <th>TECHNICAL</th>
                                    <th>TACTICAL</th>
                                    <th>PHYSICALITY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rubricData.map((row) => (
                                    <tr key={row.score}>
                                        <td className="score-cell">{row.score}</td>
                                        <td className="tier-cell">
                                            <div className={`tier-pill ${row.tier.toLowerCase()}`}>
                                                {row.tier}
                                            </div>
                                        </td>
                                        <td className="desc-cell">{row.technical}</td>
                                        <td className="desc-cell">{row.tactical}</td>
                                        <td className="desc-cell">{row.physicality}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScoringRubric;
