import { useState } from 'react';
import { Link } from 'react-router-dom';
import references from '../data/references.json';
import { Icon } from '../components/UI.jsx';

export function ReferencePage({ route }) {
  const [selected, setSelected] = useState(route.prototypes[0]);
  const reference = references.find((item) => item.prototype === `signal_desk_${selected}`);
  return (
    <div className="reference-page">
      <div className="page-heading">
        <p className="eyebrow">SIGNAL BLOGS / DESIGN REFERENCE</p>
        <h1>{route.label}</h1>
        <p>
          路由已建立。本页保留高保真原型参考；本轮优先完成「每日早报」与「正在关注」的组件和交互。
        </p>
      </div>
      <div className="reference-controls">
        {route.prototypes.map((id) => (
          <button
            className={`button ${selected === id ? 'selected' : ''}`}
            key={id}
            onClick={() => setSelected(id)}
          >
            原型 {id}
          </button>
        ))}
        <Link className="button" to="/daily">
          <Icon name="newspaper" />
          每日早报
        </Link>
        <Link className="button" to="/following">
          <Icon name="radar" />
          正在关注
        </Link>
      </div>
      <details className="reference-copy">
        <summary>查看原型中文文案与信息层级</summary>
        {reference?.text.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </details>
      <img
        className="reference-image"
        src={`/prototypes/signal_desk_${selected}.png`}
        alt={`${route.label}高保真原型参考（静态截图）`}
      />
    </div>
  );
}
