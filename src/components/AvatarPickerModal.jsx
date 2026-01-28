import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const AVATAR_STYLES = [
    { id: 'adventurer', name: 'Adventurer' },
    { id: 'avataaars', name: 'Avataaars' },
    { id: 'lorelei', name: 'Lorelei' },
    { id: 'open-peeps', name: 'Open Peeps' },
    { id: 'micah', name: 'Micah' },
    { id: 'notionists', name: 'Notionists' }
];

const BACKGROUND_OPTIONS = [
    { name: 'Sky', colors: ['b6e3f4'], type: 'solid' },
    { name: 'Peach', colors: ['ffdfbf'], type: 'solid' },
    { name: 'Lavender', colors: ['c0aede'], type: 'solid' },
    { name: 'Periwinkle', colors: ['d1d4f9'], type: 'solid' },
    { name: 'Mint', colors: ['d1f5d3'], type: 'solid' },
    { name: 'Sunset', colors: ['ffdfbf', 'ffaba4'], type: 'gradientLinear' },
    { name: 'Ocean', colors: ['b6e3f4', 'c0aede'], type: 'gradientLinear' },
    { name: 'Berry', colors: ['c0aede', 'ffaba4'], type: 'gradientLinear' },
    { name: 'Midnight', colors: ['2e3192', '1bffff'], type: 'gradientLinear' },
    { name: 'Gold', colors: ['ffd700', 'ffa500'], type: 'gradientLinear' }
];

const SEEDS = Array.from({ length: 12 }, (_, i) => `seed-${i + 1}`);

export default function AvatarPickerModal({
    isOpen,
    onClose,
    onSelect,
    currentStyle,
    currentId,
    currentBackground,
    currentBackgroundType
}) {
    const [activeTab, setActiveTab] = useState('avatar'); // 'avatar' or 'background'
    const [tempStyle, setTempStyle] = useState(currentStyle || 'adventurer');
    const [tempId, setTempId] = useState(currentId || 'seed-1');
    const [tempBg, setTempBg] = useState(currentBackground || ['b6e3f4']);
    const [tempBgType, setTempBgType] = useState(currentBackgroundType || 'solid');

    if (!isOpen) return null;

    const getAvatarUrl = (style, id, bg, bgType) => {
        const bgParams = `&backgroundColor=${bg.join(',')}&backgroundType=${bgType}`;
        return `https://api.dicebear.com/9.x/${style}/svg?seed=${id}${bgParams}`;
    };

    const handleSave = () => {
        onSelect({
            avatarStyle: tempStyle,
            avatarId: tempId,
            avatarBackground: tempBg,
            avatarBackgroundType: tempBgType
        });
    };

    return createPortal(
        <div className="avatar-modal-overlay" onClick={onClose}>
            <div className="avatar-modal-content" onClick={e => e.stopPropagation()}>
                <div className="avatar-modal-header">
                    <h2 className="avatar-modal-title">Customize Avatar</h2>
                    <button className="avatar-modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="avatar-modal-body">
                    {/* Preview Section */}
                    <div className="avatar-preview-container">
                        <div className="preview-circle">
                            <img
                                src={getAvatarUrl(tempStyle, tempId, tempBg, tempBgType)}
                                alt="Preview"
                                className="preview-img"
                            />
                        </div>
                        <p className="preview-label">Live Preview</p>
                    </div>

                    {/* Mode Tabs */}
                    <div className="avatar-mode-tabs">
                        <button
                            className={`mode-tab ${activeTab === 'avatar' ? 'active' : ''}`}
                            onClick={() => setActiveTab('avatar')}
                        >
                            <span className="material-symbols-outlined">face</span>
                            Avatar Style
                        </button>
                        <button
                            className={`mode-tab ${activeTab === 'background' ? 'active' : ''}`}
                            onClick={() => setActiveTab('background')}
                        >
                            <span className="material-symbols-outlined">palette</span>
                            Background
                        </button>
                    </div>

                    {activeTab === 'avatar' && (
                        <>
                            <div className="avatar-style-selector">
                                {AVATAR_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        className={`style-btn ${tempStyle === style.id ? 'active' : ''}`}
                                        onClick={() => setTempStyle(style.id)}
                                    >
                                        {style.name}
                                    </button>
                                ))}
                            </div>

                            <div className="avatar-grid slim-scroll">
                                {SEEDS.map(seed => {
                                    const previewUrl = getAvatarUrl(tempStyle, seed, tempBg, tempBgType);
                                    const isSelected = tempId === seed;

                                    return (
                                        <button
                                            key={seed}
                                            className={`avatar-grid-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => setTempId(seed)}
                                        >
                                            <img src={previewUrl} alt={seed} loading="lazy" />
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {activeTab === 'background' && (
                        <div className="background-grid slim-scroll">
                            {BACKGROUND_OPTIONS.map((opt, idx) => {
                                const isSelected = JSON.stringify(tempBg) === JSON.stringify(opt.colors) && tempBgType === opt.type;
                                const bgStyle = opt.type === 'solid'
                                    ? { backgroundColor: `#${opt.colors[0]}` }
                                    : { background: `linear-gradient(135deg, #${opt.colors[0]} 0%, #${opt.colors[1]} 100%)` };

                                return (
                                    <button
                                        key={idx}
                                        className={`background-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            setTempBg(opt.colors);
                                            setTempBgType(opt.type);
                                        }}
                                        title={opt.name}
                                    >
                                        <div className="bg-swatch" style={bgStyle}></div>
                                        <span className="bg-name">{opt.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="avatar-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-save-avatar" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
