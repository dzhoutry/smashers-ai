import './PlayerDescription.css';

function PlayerDescription({ value, onChange, playerName, onPlayerNameChange }) {
    const maxLength = 200;
    const remaining = maxLength - value.length;

    return (
        <div className="player-description card">
            <div className="card-header">
                <h4 className="card-title">Player to Analyse</h4>
                <p className="card-description">
                    Describe the player's appearance and position to help AI identify them
                </p>
            </div>

            <div className="description-field">
                <textarea
                    className="textarea"
                    value={value}
                    onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
                    placeholder='e.g., "Male player in black singlet on the right side of the court"'
                    rows={3}
                />
                <div className="char-counter">
                    <span className={remaining < 20 ? 'low' : ''}>
                        {remaining} characters remaining
                    </span>
                </div>
            </div>

            <div className="player-name-field">
                <label className="player-name-label">Player Name (for reference)</label>
                <input
                    type="text"
                    className="player-name-input"
                    value={playerName || ''}
                    onChange={(e) => onPlayerNameChange(e.target.value)}
                    placeholder='e.g., "John Smith" or "Player 1"'
                    maxLength={50}
                />
            </div>
        </div>
    );
}

export default PlayerDescription;
