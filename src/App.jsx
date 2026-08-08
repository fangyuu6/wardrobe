import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  CaretRight,
  Check,
  CloudSun,
  DotsThree,
  Heart,
  House,
  ImageSquare,
  LockSimple,
  MagnifyingGlass,
  MapPin,
  PencilSimple,
  Plus,
  TShirt,
  SlidersHorizontal,
  Sparkle,
  Star,
  SquaresFour,
  Suitcase,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import "./styles.css";

const STORAGE_KEY = "my-wardrobe-items-v1";
const OUTFIT_FEEDBACK_STORAGE_KEY = "my-wardrobe-outfit-feedback-v1";
const STATIC_DATA_BASE = `${import.meta.env.BASE_URL || "/"}wardrobe-data/`;

function staticDataUrl(file) {
  return `${STATIC_DATA_BASE}${file}`;
}

function staticAssetUrl(asset) {
  if (!asset || typeof asset !== "string" || asset.startsWith("/api/") || asset.startsWith("data:") || asset.startsWith("blob:")) return asset;
  return `${import.meta.env.BASE_URL || "/"}${asset.replace(/^\/+/, "")}`;
}

const IMPORTED_CATEGORY_MAP = {
  upperbody: { id: "upper", label: "上衣" },
  wholebody_up: { id: "outer", label: "外套" },
  lowerbody: { id: "bottom", label: "下装" },
  accessories_up: { id: "accessory", label: "配饰" },
  shoes: { id: "shoes", label: "鞋履" },
};

const IMPORTED_ART_MAP = {
  upperbody: "shirt",
  wholebody_up: "blazer",
  lowerbody: "jeans",
  accessories_up: "bag",
  shoes: "sneaker",
};

const CATEGORY_TO_PART = {
  upper: "upperbody",
  outer: "wholebody_up",
  bottom: "lowerbody",
  accessory: "accessories_up",
  shoes: "shoes",
};

const CATEGORY_TABS = [
  { id: "all", label: "全部" },
  { id: "upper", label: "上衣" },
  { id: "bottom", label: "下装" },
  { id: "outer", label: "外套" },
  { id: "shoes", label: "鞋履" },
  { id: "accessory", label: "配饰" },
];

const RATING_LABELS = ["未评价", "不喜欢", "不太喜欢", "一般", "喜欢", "很喜欢"];
const FEEDBACK_TAGS = ["好搭", "难搭", "想看外套搭配", "缺少搭档", "缺少鞋子", "暂时少穿", "想多穿", "适合购买同类"];
const OUTFIT_FEEDBACK_TAGS = ["值得保留", "不想要这类", "想看类似", "太正式", "太常规", "比例不对", "厚重冲突", "颜色不对", "需要换鞋", "需要换外套", "需要换内搭", "想看短裤搭配", "想要更简单"];
const OUTFIT_SORT_OPTIONS = [
  { id: "feedback", label: "反馈优先", description: "优先显示你评价较高、且搭配关系更成立的成品。" },
  { id: "balanced", label: "均衡轮换", description: "在你的反馈、单品关系和衣橱覆盖之间保持平衡。" },
  { id: "explore", label: "探索未评价", description: "先显示整套还没评价过、且包含更多未评价单品的组合。" },
];
const OUTFIT_SORT_WEIGHTS = {
  feedback: [{ label: "整套反馈", value: 50 }, { label: "单品反馈", value: 35 }, { label: "探索", value: 15 }],
  balanced: [{ label: "整套反馈", value: 35 }, { label: "单品关系", value: 35 }, { label: "探索轮换", value: 30 }],
  explore: [{ label: "整套未评价", value: 45 }, { label: "未评价单品", value: 35 }, { label: "单品关系", value: 20 }],
};

const SEED_ITEMS = [
  { id: "seed-linen", name: "亚麻白衬衫", category: "upper", categoryLabel: "上衣", color: "#f0ece2", colorName: "奶油白", art: "shirt", bg: "linen", favorite: true, wears: 12, lastWorn: "3天前", tag: "轻盈透气" },
  { id: "seed-denim", name: "直筒牛仔裤", category: "bottom", categoryLabel: "下装", color: "#526b89", colorName: "水洗蓝", art: "jeans", bg: "blue", favorite: false, wears: 18, lastWorn: "昨天", tag: "高频单品" },
  { id: "seed-blazer", name: "燕麦色西装", category: "outer", categoryLabel: "外套", color: "#b9a996", colorName: "燕麦色", art: "blazer", bg: "sand", favorite: true, wears: 9, lastWorn: "一周前", tag: "通勤" },
  { id: "seed-knit", name: "橄榄绿针织衫", category: "upper", categoryLabel: "上衣", color: "#6f795c", colorName: "橄榄绿", art: "knit", bg: "olive", favorite: false, wears: 6, lastWorn: "12天前", tag: "柔软亲肤" },
  { id: "seed-skirt", name: "黑色伞裙", category: "bottom", categoryLabel: "下装", color: "#262829", colorName: "墨黑", art: "skirt", bg: "charcoal", favorite: false, wears: 7, lastWorn: "5天前", tag: "显比例" },
  { id: "seed-sneaker", name: "复古跑鞋", category: "shoes", categoryLabel: "鞋履", color: "#d2c5b4", colorName: "复古米", art: "sneaker", bg: "clay", favorite: true, wears: 21, lastWorn: "今天", tag: "舒适" },
  { id: "seed-bag", name: "棕色小方包", category: "accessory", categoryLabel: "配饰", color: "#794f35", colorName: "焦糖棕", art: "bag", bg: "cocoa", favorite: false, wears: 15, lastWorn: "昨天", tag: "日常" },
  { id: "seed-dress", name: "雾蓝连衣裙", category: "upper", categoryLabel: "上衣", color: "#8da5af", colorName: "雾蓝", art: "dress", bg: "mist", favorite: false, wears: 4, lastWorn: "2周前", tag: "约会" },
];

const NAV_ITEMS = [
  { id: "home", label: "今日衣橱", icon: House },
  { id: "collection", label: "我的单品", icon: SquaresFour },
  { id: "outfits", label: "穿搭灵感", icon: Sparkle },
  { id: "packing", label: "旅行行李", icon: Suitcase },
];

function readItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(stored) && stored.length ? stored : SEED_ITEMS;
  } catch {
    return SEED_ITEMS;
  }
}

function readOutfitFeedback() {
  try {
    const stored = JSON.parse(localStorage.getItem(OUTFIT_FEEDBACK_STORAGE_KEY) || "null");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function colorLabel(name, color) {
  if (name.includes("卡其")) return "卡其色";
  if (name.includes("棕灰")) return "棕灰";
  if (name.includes("米灰")) return "米灰";
  if (name.includes("黑")) return "墨黑";
  if (name.includes("白")) return "奶油白";
  if (name.includes("灰")) return "浅灰";
  if (name.includes("藏蓝")) return "藏蓝";
  if (name.includes("棕")) return "深棕";
  if (name.includes("红")) return "正红";
  if (name.includes("绿色")) return "军绿色";
  if (name.includes("米色") || name.includes("奶油")) return "米色";
  return color;
}

function mapImportedItem(record) {
  const category = IMPORTED_CATEGORY_MAP[record.part] || IMPORTED_CATEGORY_MAP.upperbody;
  return {
    ...record,
    category: category.id,
    categoryLabel: category.label,
    colorName: record.colorName || colorLabel(record.name || "", record.color),
    art: IMPORTED_ART_MAP[record.part] || "shirt",
    bg: "linen",
    favorite: false,
    wears: 0,
    lastWorn: "刚刚加入",
    tag: record.tags?.[0] || "",
    rating: Number.isInteger(record.rating) ? record.rating : 0,
    feedbackTags: Array.isArray(record.feedbackTags) ? record.feedbackTags : [],
    feedbackNote: typeof record.feedbackNote === "string" ? record.feedbackNote : "",
    imported: true,
  };
}

function mergeImportedRecords(records, currentItems) {
  const storedById = new Map(currentItems.map((item) => [item.id, item]));
  const customItems = currentItems.filter((item) => String(item.id).startsWith("custom-"));
  const importedItems = records.map((record) => {
    const mapped = mapImportedItem(record);
    const stored = storedById.get(mapped.id);
    if (!stored) return mapped;
    return {
      ...mapped,
      favorite: typeof stored.favorite === "boolean" ? stored.favorite : mapped.favorite,
      wears: Number.isFinite(stored.wears) ? stored.wears : mapped.wears,
      lastWorn: stored.lastWorn ?? mapped.lastWorn,
      tag: stored.tag ?? mapped.tag,
      rating: Number.isInteger(stored.rating) ? stored.rating : mapped.rating,
      feedbackTags: Array.isArray(stored.feedbackTags) ? stored.feedbackTags : mapped.feedbackTags,
      feedbackNote: typeof stored.feedbackNote === "string" ? stored.feedbackNote : mapped.feedbackNote,
    };
  });
  return [...customItems, ...importedItems];
}

function rotatedItems(list, count, offset = 0) {
  if (!list.length || count <= 0) return [];
  const start = ((offset % list.length) + list.length) % list.length;
  return Array.from({ length: Math.min(count, list.length) }, (_, index) => list[(start + index) % list.length]);
}

const OUTFIT_TITLES = ["洛杉矶轻松出门", "通勤之后", "周末慢逛", "日落散步", "城市层次", "轻装日常"];

function feedbackScore(item) {
  const ratingScore = item.rating > 0 ? (item.rating - 3) * 0.7 : 0;
  const tags = new Set(item.feedbackTags || []);
  return ratingScore
    + (tags.has("好搭") ? 1.2 : 0)
    + (tags.has("想多穿") ? 1 : 0)
    + (tags.has("难搭") ? -1.1 : 0)
    + (tags.has("暂时少穿") ? -0.35 : 0);
}

function outfitFeedbackScore(items) {
  return items.reduce((score, item) => score + feedbackScore(item), 0);
}

function lookFeedbackScore(feedback = {}) {
  const tags = new Set(feedback.feedbackTags || []);
  return (feedback.rating > 0 ? (feedback.rating - 3) * 1.1 : 0)
    + (tags.has("值得保留") ? 1.8 : 0)
    + (tags.has("想看类似") ? 1 : 0)
    + (tags.has("不想要这类") ? -1.8 : 0)
    + (tags.has("太正式") ? -1.4 : 0)
    + (tags.has("太常规") ? -0.9 : 0)
    + (tags.has("比例不对") ? -1.3 : 0)
    + (tags.has("厚重冲突") ? -1.4 : 0)
    + (tags.has("颜色不对") ? -1.1 : 0);
}

function hasItemFeedback(item) {
  return item.rating > 0 || (item.feedbackTags || []).length > 0 || Boolean(item.feedbackNote);
}

function hasLookFeedback(feedback = {}) {
  return feedback.rating > 0 || (feedback.feedbackTags || []).length > 0 || Boolean(feedback.feedbackNote);
}

function unexploredItemCount(outfit) {
  return outfit.items.filter((item) => !hasItemFeedback(item)).length;
}

function outfitSortScore(outfit, mode) {
  const itemScore = outfitFeedbackScore(outfit.items);
  const lookScore = lookFeedbackScore(outfit.feedback);
  const unexploredCount = unexploredItemCount(outfit);
  if (mode === "explore") return unexploredCount * 1.4 + itemScore * 0.35 + lookScore * 0.4;
  if (mode === "balanced") return itemScore * 0.85 + lookScore + unexploredCount * 0.55;
  return itemScore * 1.15 + lookScore * 1.45 + unexploredCount * 0.08;
}

function sortOutfitCandidates(outfits, mode) {
  return [...outfits].sort((left, right) => {
    if (mode === "explore") {
      const lookDelta = Number(!hasLookFeedback(right.feedback)) - Number(!hasLookFeedback(left.feedback));
      if (lookDelta) return lookDelta;
      const itemDelta = unexploredItemCount(right) - unexploredItemCount(left);
      if (itemDelta) return itemDelta;
    }
    return outfitSortScore(right, mode) - outfitSortScore(left, mode);
  });
}

function rotateOutfitCandidates(outfits, mode, round) {
  if (mode === "balanced") return rotatedItems(outfits, outfits.length, round);
  const pinned = Math.min(3, outfits.length);
  return [...outfits.slice(0, pinned), ...rotatedItems(outfits.slice(pinned), outfits.length - pinned, round)];
}

function buildOutfits(items, round, sortMode = "feedback") {
  if (!items.length) return [];
  const grouped = Object.fromEntries(CATEGORY_TABS.slice(1).map((category) => [category.id, items.filter((item) => item.category === category.id)]));
  const templates = [
    ["outer", "upper", "bottom", "shoes"],
    ["upper", "bottom", "shoes", "accessory"],
  ];

  return templates.map((template, lookIndex) => {
    const selected = template.flatMap((category, categoryIndex) => {
      const candidates = [...(grouped[category] || [])].sort((left, right) => {
        const leftScore = feedbackScore(left) + (sortMode === "explore" && !hasItemFeedback(left) ? 1.2 : 0);
        const rightScore = feedbackScore(right) + (sortMode === "explore" && !hasItemFeedback(right) ? 1.2 : 0);
        return rightScore - leftScore;
      });
      return rotatedItems(candidates, 1, round + lookIndex * 2 + categoryIndex);
    });
    const selectedIds = new Set(selected.map((item) => item.id));
    const fallback = rotatedItems(items.filter((item) => !selectedIds.has(item.id)), Math.max(0, 3 - selected.length), round + lookIndex * 3);
    const pieces = [...selected, ...fallback].slice(0, 4);
    return {
      id: `look-${round}-${lookIndex}`,
      title: OUTFIT_TITLES[(round * 2 + lookIndex) % OUTFIT_TITLES.length],
      subtitle: pieces.map((item) => item.name).join(" · "),
      items: pieces,
      accent: lookIndex === 0 ? "terracotta" : "olive",
    };
  });
}

function buildPackingList(items, days, round) {
  if (!items.length) return [];
  const targets = [
    ["upper", Math.min(days + 1, 7)],
    ["bottom", Math.min(Math.max(1, Math.ceil(days / 2)), 4)],
    ["outer", Math.min(Math.max(1, Math.ceil(days / 7)), 2)],
    ["shoes", days >= 5 ? 2 : 1],
    ["accessory", days >= 4 ? 2 : 1],
  ];
  const selected = [];
  const selectedIds = new Set();

  targets.forEach(([category, count], categoryIndex) => {
    const candidates = items.filter((item) => item.category === category);
    rotatedItems(candidates, count, round + categoryIndex).forEach((item) => {
      if (!selectedIds.has(item.id)) {
        selected.push(item);
        selectedIds.add(item.id);
      }
    });
  });

  const minimum = Math.min(items.length, Math.max(3, Math.min(days + 3, 8)));
  rotatedItems(items.filter((item) => !selectedIds.has(item.id)), minimum - selected.length, round + days).forEach((item) => selected.push(item));
  return selected;
}

function buildFeedbackInsight(items, outfitFeedback = {}) {
  const rated = items.filter((item) => item.rating > 0);
  const ratedLooks = Object.values(outfitFeedback).filter((feedback) => feedback && (feedback.rating > 0 || (feedback.feedbackTags || []).length || feedback.feedbackNote));
  const lookTagCounts = new Map();
  ratedLooks.flatMap((feedback) => feedback.feedbackTags || []).forEach((tag) => lookTagCounts.set(tag, (lookTagCounts.get(tag) || 0) + 1));
  const lookSignal = ["不想要这类", "太正式", "太常规", "比例不对", "厚重冲突", "颜色不对", "需要换鞋", "需要换外套", "需要换内搭", "想看短裤搭配", "想看类似"].find((tag) => lookTagCounts.has(tag));
  const lookSuggestions = {
    "不想要这类": "这类组合已经出现明确的排斥信号。下一轮会减少相似的正式、常规或为了搭配而搭配的框架。",
    "太正式": "下一轮会保留整洁的结构，但减少西装感，优先用轻薄短夹克、针织或更松弛的外套替代。",
    "太常规": "下一轮会避开白T加牛仔这类默认答案，保留日常感，但增加材质、比例或一处有意识的张力。",
    "比例不对": "下一轮会先修正上下装体量、衣长和鞋面关系，再考虑颜色，不再用换颜色掩盖比例问题。",
    "厚重冲突": "下一轮会把季节和重量作为硬条件，厚外套不再和短裤直接叠加，除非整体有明确的过渡。",
    "颜色不对": "下一轮会减少跳脱的孤立颜色，先寻找能压住或呼应它的中性色和外套关系。",
    "需要换鞋": "你认可这套的整体方向，但鞋子是瓶颈。下一轮购买建议会优先找能解决裤脚和比例的鞋型。",
    "需要换外套": "你认可这套的基础关系，但外套还没到位。下一轮会优先找能串起现有单品的轻薄外套。",
    "需要换内搭": "下一轮会保留外层和下装的关系，只替换内搭，让颜色和层次更自然。",
    "想看短裤搭配": "下一轮会优先从你已有的短裤出发，寻找真正能成立的外套和鞋履关系。",
    "想看类似": "下一轮会沿着这套的比例、颜色和材质继续找，而不是泛泛推荐同一种衣服。",
  };
  if (lookSignal) return {
    title: "搭配反馈给出方向",
    description: lookSuggestions[lookSignal],
    meta: `已评价 ${ratedLooks.length} 套搭配`,
  };
  if (!rated.length && !ratedLooks.length) return {
    title: "先建立你的衣橱判断",
    description: "打开几件单品或一套成品搭配，评价喜欢程度并勾选反馈。之后搭配和购买建议会优先参考你的真实选择。",
    meta: "还没有评价",
  };
  const tagCounts = new Map();
  rated.flatMap((item) => item.feedbackTags || []).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
  const priorities = ["想看外套搭配", "缺少搭档", "缺少鞋子", "适合购买同类"];
  const signal = priorities.find((tag) => tagCounts.has(tag));
  const suggestions = {
    "想看外套搭配": "下一轮优先寻找能把现有单品串起来的轻薄短夹克或结构外套。",
    "缺少搭档": "下一轮先找能和多件衣服产生关系的中性桥梁单品，不急着买孤立的亮色。",
    "缺少鞋子": "下一轮优先补能解决裤脚和短裤比例的鞋型，而不是继续增加上衣。",
    "适合购买同类": "先观察你反复喜欢的颜色、材质和版型，再推荐同类的真正缺口。",
  };
  const favorite = [...rated].sort((a, b) => b.rating - a.rating)[0];
  return {
    title: signal ? "下一件购买方向" : "你的审美信号正在形成",
    description: signal ? suggestions[signal] : `目前最明确的偏好是“${favorite.name}”这类单品。再评价几件，系统会开始区分你喜欢的颜色、材质和比例。`,
    meta: `已评价 ${rated.length} 件${ratedLooks.length ? ` · ${ratedLooks.length} 套搭配` : ""} · 只影响优先级`,
  };
}

function GarmentArt({ item, compact = false }) {
  const common = { fill: item.color, stroke: "rgba(36, 32, 28, .22)", strokeWidth: 1.5, strokeLinejoin: "round" };
  const detail = { fill: "none", stroke: "rgba(255, 255, 255, .5)", strokeWidth: 1.5, strokeLinecap: "round" };

  return (
    <div className={`garment-art garment-art--${item.bg} ${compact ? "garment-art--compact" : ""}`}>
      <span className="art-index">{item.categoryLabel}</span>
      <svg viewBox="0 0 180 220" aria-hidden="true">
        {item.art === "shirt" && <>
          <path d="M63 42 80 33h20l17 9 23 17-12 28-14-8v81H66V79l-14 8-12-28 23-17Z" {...common} />
          <path d="m80 34 10 17 10-17M72 76h36M90 53v103" {...detail} />
        </>}
        {item.art === "knit" && <>
          <path d="M62 43 79 32h22l17 11 21 15-10 35-17-9v83H68V84l-17 9-10-35 21-15Z" {...common} />
          <path d="M79 33c3 11 19 11 22 0M69 83h42M90 62v95M61 53l-8 29M119 53l8 29" {...detail} />
        </>}
        {item.art === "blazer" && <>
          <path d="m61 39 26-9h6l26 9 18 28-17 15-9-11v73H69V71l-9 11-17-15 18-28Z" {...common} />
          <path d="m87 31 3 31 3-31M90 62l-13 25 13 16 13-16-13-25M90 103v41M77 117h26" {...detail} />
        </>}
        {item.art === "jeans" && <>
          <path d="M61 35h58l7 53-14 99H91l-3-91-3 91H57L43 88l7-53h11Z" {...common} />
          <path d="M73 36v24h34V36M88 60v36M55 86l18-7M107 79l14 7M92 187h25" {...detail} />
        </>}
        {item.art === "skirt" && <>
          <path d="M63 34h54l3 29-8 11 24 104H44l24-104-8-11 3-29Z" {...common} />
          <path d="M63 62h54M70 74l-16 99M110 74l16 99M90 75v98" {...detail} />
        </>}
        {item.art === "sneaker" && <>
          <path d="M43 123c13-5 27-13 38-28l21 19c7 7 19 13 35 18 12 4 19 13 18 26H39c-5-14-4-28 4-35Z" {...common} />
          <path d="m78 96 14 18M87 102l15 15M44 147h108M51 134l34-4" {...detail} />
        </>}
        {item.art === "bag" && <>
          <path d="M50 76h80l7 99H43l7-99Z" {...common} />
          <path d="M68 78V59c0-28 44-28 44 0v19M57 99h66" {...detail} />
        </>}
        {item.art === "dress" && <>
          <path d="M76 32h28l3 45 27 90H46l27-90 3-45Z" {...common} />
          <path d="M76 33c2 10 26 10 28 0M77 77h26M90 77v90" {...detail} />
        </>}
      </svg>
    </div>
  );
}

function ItemCard({ item, onOpen, onFavorite }) {
  return (
    <article className="item-card" onClick={() => onOpen(item)}>
      <div className="item-card__visual">
        {item.image ? <img className="item-photo" src={item.image} alt={item.name} /> : <GarmentArt item={item} />}
        <button
          type="button"
          className={`favorite-button ${item.favorite ? "is-favorite" : ""}`}
          onClick={(event) => { event.stopPropagation(); onFavorite(item.id); }}
          aria-label={item.favorite ? "取消收藏" : "收藏单品"}
        >
          <Heart size={16} weight={item.favorite ? "fill" : "regular"} />
        </button>
        <button type="button" className="card-arrow" onClick={(event) => { event.stopPropagation(); onOpen(item); }} aria-label="查看详情">
          <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="item-card__meta">
        <div>
          <h3>{item.name}</h3>
          <p>{item.categoryLabel} · {item.colorName}</p>
        </div>
        <span className="item-card__signals">
          {item.rating > 0 && <span className="item-rating"><Star size={11} weight="fill" /> {item.rating}</span>}
          <span className="item-wears">穿过 {item.wears} 次</span>
        </span>
      </div>
    </article>
  );
}

function Stat({ value, label, note }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
      {note && <small>{note}</small>}
    </div>
  );
}

function AddItemModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", category: "upper", color: "#d8d0c4", colorName: "", tag: "" });
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const readImage = (file) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) { setError("给这件单品起个名字吧"); return; }
    onAdd({ ...form, name: form.name.trim(), image, categoryLabel: CATEGORY_TABS.find((tab) => tab.id === form.category)?.label || "上衣" });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-item-title">
        <div className="modal__header">
          <div><span className="eyebrow">NEW PIECE</span><h2 id="add-item-title">加入一件单品</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭"><X size={20} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="upload-box">
            {image ? <img src={image} alt="待添加单品预览" /> : <>
              <div className="upload-box__icon"><UploadSimple size={22} /></div>
              <strong>上传单品照片</strong>
              <span>支持 JPG、PNG，也可以稍后补充</span>
            </>}
            <input type="file" accept="image/*" onChange={(event) => readImage(event.target.files?.[0])} aria-label="上传单品照片" />
            {image && <button type="button" className="upload-remove" onClick={() => setImage("")}><X size={14} /> 移除照片</button>}
          </div>
          <label className="field"><span>单品名称</span><input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="例如：浅灰羊绒开衫" /></label>
          <div className="field-grid">
            <label className="field"><span>分类</span><select value={form.category} onChange={(event) => update("category", event.target.value)}>{CATEGORY_TABS.slice(1).map((tab) => <option value={tab.id} key={tab.id}>{tab.label}</option>)}</select></label>
            <label className="field"><span>颜色</span><div className="color-input"><input type="color" value={form.color} onChange={(event) => update("color", event.target.value)} /><input value={form.colorName} onChange={(event) => update("colorName", event.target.value)} placeholder="颜色名称" /></div></label>
          </div>
          <label className="field"><span>备注 <em>选填</em></span><input value={form.tag} onChange={(event) => update("tag", event.target.value)} placeholder="例如：周末、需要熨烫" /></label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal__actions"><button type="button" className="button button--ghost" onClick={onClose}>取消</button><button className="button button--dark" type="submit"><Plus size={17} /> 添加到衣橱</button></div>
        </form>
      </section>
    </div>
  );
}

function EditItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name: item.name,
    category: item.category,
    color: item.color || "#d8d0c4",
    colorName: item.colorName || "",
  });
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) { setError("单品名称不能为空"); return; }
    onSave({ ...form, id: item.id, name: form.name.trim(), colorName: form.colorName.trim() });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal modal--edit" role="dialog" aria-modal="true" aria-labelledby="edit-item-title">
        <div className="modal__header">
          <div><span className="eyebrow">EDIT PIECE</span><h2 id="edit-item-title">编辑单品</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭"><X size={20} /></button>
        </div>
        <div className="edit-preview">
          {item.image ? <img src={item.image} alt={item.name} /> : <GarmentArt item={item} compact />}
          <div><strong>{item.name}</strong><span>只修改资料，不会改变透明单品图</span></div>
        </div>
        <form onSubmit={submit}>
          <label className="field"><span>单品名称</span><input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
          <div className="field-grid">
            <label className="field"><span>分类</span><select value={form.category} onChange={(event) => update("category", event.target.value)}>{CATEGORY_TABS.slice(1).map((tab) => <option value={tab.id} key={tab.id}>{tab.label}</option>)}</select></label>
            <label className="field"><span>颜色</span><div className="color-input"><input type="color" value={form.color} onChange={(event) => update("color", event.target.value)} /><input value={form.colorName} onChange={(event) => update("colorName", event.target.value)} placeholder="颜色名称" /></div></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal__actions"><button type="button" className="button button--ghost" onClick={onClose}>取消</button><button className="button button--dark" type="submit"><Check size={17} /> 保存修改</button></div>
        </form>
      </section>
    </div>
  );
}

function DetailDrawer({ item, onClose, onFavorite, onDelete, onEdit, onSaveFeedback }) {
  const [previewMode, setPreviewMode] = useState("garment");
  const [rating, setRating] = useState(item?.rating || 0);
  const [feedbackTags, setFeedbackTags] = useState(item?.feedbackTags || []);
  const [feedbackNote, setFeedbackNote] = useState(item?.feedbackNote || "");
  useEffect(() => setPreviewMode("garment"), [item?.id]);
  useEffect(() => {
    setRating(item?.rating || 0);
    setFeedbackTags(item?.feedbackTags || []);
    setFeedbackNote(item?.feedbackNote || "");
  }, [item?.id]);
  if (!item) return null;
  const showingModeled = previewMode === "modeled" && item.modeledImage;
  const toggleFeedbackTag = (tag) => setFeedbackTags((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]);
  return (
    <div className="drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="单品详情">
        <div className="drawer__top"><span className="eyebrow">ITEM DETAILS</span><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X size={20} /></button></div>
        {item.modeledImage && <div className="drawer-preview-tabs" aria-label="单品图片类型">
          <button type="button" className={previewMode === "garment" ? "active" : ""} aria-pressed={previewMode === "garment"} onClick={() => setPreviewMode("garment")}>透明单品</button>
          <button type="button" className={previewMode === "modeled" ? "active" : ""} aria-pressed={previewMode === "modeled"} onClick={() => setPreviewMode("modeled")}>上身效果</button>
        </div>}
        <div className={`drawer__visual ${showingModeled ? "drawer__visual--modeled" : ""}`}>
          {showingModeled
            ? <img src={item.modeledImage} alt={`${item.name}的上身效果`} />
            : item.image ? <img src={item.image} alt={item.name} /> : <GarmentArt item={item} />}
        </div>
        <div className="drawer__body">
          <div className="drawer__title"><div><span className="kicker">{item.categoryLabel}</span><h2>{item.name}</h2></div><button type="button" className={`drawer-heart ${item.favorite ? "is-favorite" : ""}`} onClick={() => onFavorite(item.id)}><Heart size={20} weight={item.favorite ? "fill" : "regular"} /></button></div>
          <p className="drawer__description">这件单品很适合放进你的日常轮换里。记录它的穿着频率，慢慢找到最适合你的衣橱节奏。</p>
          <div className="drawer__facts"><div><span>颜色</span><strong><i style={{ background: item.color }} />{item.colorName || "自定义色"}</strong></div><div><span>穿着次数</span><strong>{item.wears} 次</strong></div><div><span>最近穿着</span><strong>{item.lastWorn || "刚刚加入"}</strong></div></div>
          {item.tag && <div className="drawer__tag">#{item.tag}</div>}
          <section className="drawer-feedback" aria-labelledby="feedback-title">
            <div className="drawer-feedback__head"><div><span className="kicker">YOUR FEEDBACK</span><h3 id="feedback-title">评价这件单品</h3></div><span className="drawer-feedback__score">{rating ? `${rating}/5` : "未评价"}</span></div>
            <div className="rating-picker" role="radiogroup" aria-label="喜欢程度">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return <button key={value} type="button" className={value <= rating ? "is-rated" : ""} onClick={() => setRating(value)} role="radio" aria-checked={rating === value} aria-label={`${value}分：${RATING_LABELS[value]}`}><Star size={21} weight={value <= rating ? "fill" : "regular"} /></button>;
              })}
              <span>{RATING_LABELS[rating]}</span>
            </div>
            <div className="feedback-tag-picker" aria-label="搭配反馈">
              {FEEDBACK_TAGS.map((tag) => <button key={tag} type="button" className={feedbackTags.includes(tag) ? "active" : ""} aria-pressed={feedbackTags.includes(tag)} onClick={() => toggleFeedbackTag(tag)}>{tag}</button>)}
            </div>
            <textarea value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} placeholder="可以写：喜欢它的什么、哪里难搭、想看它和什么搭配……" maxLength={500} aria-label="评价备注" />
            <button type="button" className="button button--dark drawer-feedback__save" onClick={() => onSaveFeedback(item.id, { rating, feedbackTags, feedbackNote })}><Check size={15} /> 保存评价</button>
          </section>
          <button type="button" className="button button--outline drawer-edit" onClick={() => onEdit(item)}><PencilSimple size={15} /> 编辑单品</button>
          <button type="button" className="drawer-delete" onClick={() => onDelete(item.id)}><Trash size={15} /> 从衣橱移除</button>
        </div>
      </aside>
    </div>
  );
}

function OutfitCard({ outfit, index, onOpen }) {
  const { title, subtitle, items, accent, image } = outfit;
  return (
    <article className={`outfit-card outfit-card--${accent}`}>
      <div className="outfit-card__top"><div><span className="eyebrow">LOOK {String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{subtitle}</p></div><button type="button" className="round-arrow" onClick={() => onOpen(outfit)} aria-label={`查看${title}详情`}><ArrowUpRight size={17} /></button></div>
      {image ? <img className="outfit-look-photo" src={image} alt={`${title}整套上身效果`} /> : <div className="outfit-collage">{items.map((item) => <div className="outfit-collage__item" key={item.id}>{item.image ? <img className="outfit-photo" src={item.image} alt={item.name} /> : <GarmentArt item={item} compact />}</div>)}</div>}
      <div className="outfit-card__footer"><span>{image ? "搭配成品" : "今日推荐"}</span>{outfit.feedback?.rating > 0 && <span className="outfit-card__rating"><Star size={11} weight="fill" /> {outfit.feedback.rating}</span>}<DotsThree size={20} /></div>
    </article>
  );
}

function OutfitDetailModal({ outfit, onClose, onSaveFeedback }) {
  const [rating, setRating] = useState(outfit?.feedback?.rating || 0);
  const [feedbackTags, setFeedbackTags] = useState(outfit?.feedback?.feedbackTags || []);
  const [feedbackNote, setFeedbackNote] = useState(outfit?.feedback?.feedbackNote || "");
  useEffect(() => {
    setRating(outfit?.feedback?.rating || 0);
    setFeedbackTags(outfit?.feedback?.feedbackTags || []);
    setFeedbackNote(outfit?.feedback?.feedbackNote || "");
  }, [outfit?.id]);
  if (!outfit) return null;
  const modeledItems = outfit.items.filter((item) => item.modeledImage);
  const toggleFeedbackTag = (tag) => setFeedbackTags((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal outfit-detail" role="dialog" aria-modal="true" aria-labelledby="outfit-detail-title">
        <div className="modal__header">
          <div><span className="eyebrow">OUTFIT DETAILS</span><h2 id="outfit-detail-title">{outfit.title}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭穿搭详情"><X size={20} /></button>
        </div>
        {outfit.image ? <figure className="outfit-hero"><img src={outfit.image} alt={`${outfit.title}整套上身效果`} /><figcaption>{outfit.reason || outfit.subtitle}</figcaption></figure> : modeledItems.length ? <div className="outfit-modeled">
          {modeledItems.map((item) => <figure key={item.id}><img src={item.modeledImage} alt={`${item.name}的模特效果图`} /><figcaption>{item.name} · 已有效果图</figcaption></figure>)}
        </div> : <div className="outfit-model-empty"><ImageSquare size={24} /><span>这套暂无真人效果图，仍可用透明单品预览组合。</span></div>}
        <div className="outfit-piece-list">
          {outfit.items.map((item) => <div className="outfit-piece" key={item.id}>
            <div className="outfit-piece__visual">{item.image ? <img src={item.image} alt="" /> : <GarmentArt item={item} compact />}</div>
            <div><span>{item.categoryLabel}</span><strong>{item.name}</strong><small>{item.colorName || "自定义色"}</small></div>
          </div>)}
        </div>
        <section className="outfit-feedback" aria-labelledby="outfit-feedback-title">
          <div className="outfit-feedback__head"><div><span className="kicker">LOOK FEEDBACK</span><h3 id="outfit-feedback-title">评价这套搭配</h3></div><span className="outfit-feedback__score">{rating ? `${rating}/5` : "未评价"}</span></div>
          <p className="outfit-feedback__hint">这套整体是否成立？和单品评价分开记录。</p>
          <div className="rating-picker" role="radiogroup" aria-label="整套搭配喜欢程度">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              return <button key={value} type="button" className={value <= rating ? "is-rated" : ""} onClick={() => setRating(value)} role="radio" aria-checked={rating === value} aria-label={`${value}分：${RATING_LABELS[value]}`}><Star size={21} weight={value <= rating ? "fill" : "regular"} /></button>;
            })}
            <span>{RATING_LABELS[rating]}</span>
          </div>
          <div className="feedback-tag-picker outfit-feedback__tags" aria-label="整套搭配反馈">
            {OUTFIT_FEEDBACK_TAGS.map((tag) => <button key={tag} type="button" className={feedbackTags.includes(tag) ? "active" : ""} aria-pressed={feedbackTags.includes(tag)} onClick={() => toggleFeedbackTag(tag)}>{tag}</button>)}
          </div>
          <textarea value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} placeholder="可以写：哪里好看、哪里别扭、想保留哪一部分……" maxLength={500} aria-label="整套搭配评价备注" />
          <button type="button" className="button button--dark outfit-feedback__save" onClick={() => onSaveFeedback(outfit.id, { rating, feedbackTags, feedbackNote })}><Check size={15} /> 保存这套评价</button>
        </section>
        <div className="modal__actions"><button type="button" className="button button--dark" onClick={onClose}>完成</button></div>
      </section>
    </div>
  );
}

function PackingPlanner({ items, days, onDaysChange, packingItems, packedIds, onGenerate, onToggle }) {
  const packedCount = packingItems.filter((item) => packedIds.includes(item.id)).length;
  const progress = packingItems.length ? Math.round((packedCount / packingItems.length) * 100) : 0;
  return (
    <section className="packing-planner">
      <div className="packing-banner">
        <div className="packing-banner__icon"><Suitcase size={26} /></div>
        <div className="packing-banner__copy"><span className="kicker">PACK LIGHT</span><h2>下一次旅行，<em>带得刚刚好。</em></h2><p>按天数从当前衣橱生成一份上衣、下装、外套、鞋履与配饰相对均衡的清单。</p></div>
        <div className="packing-controls">
          <label htmlFor="trip-days">旅行天数</label>
          <div><input id="trip-days" type="number" min="1" max="14" value={days} onChange={(event) => onDaysChange(event.target.value)} /><span>天</span></div>
          <button type="button" className="button button--dark" onClick={onGenerate} disabled={!items.length}>{packingItems.length ? "重新生成" : "生成清单"}</button>
        </div>
      </div>
      {packingItems.length ? <div className="packing-results">
        <div className="packing-results__head"><div><span className="kicker">YOUR LIST</span><h3>{days} 天轻装清单</h3></div><div className="packing-progress" aria-live="polite"><strong>{packedCount}/{packingItems.length}</strong><span>已装好</span><i><b style={{ width: `${progress}%` }} /></i></div></div>
        <div className="packing-list">
          {packingItems.map((item) => {
            const packed = packedIds.includes(item.id);
            return <label className={`packing-item ${packed ? "is-packed" : ""}`} key={item.id}>
              <input type="checkbox" checked={packed} onChange={() => onToggle(item.id)} />
              <span className="packing-checkbox"><Check size={14} weight="bold" /></span>
              <span className="packing-item__visual">{item.image ? <img src={item.image} alt="" /> : <GarmentArt item={item} compact />}</span>
              <span className="packing-item__copy"><strong>{item.name}</strong><small>{item.categoryLabel} · {item.colorName || "自定义色"}</small></span>
            </label>;
          })}
        </div>
      </div> : <div className="packing-empty"><Suitcase size={25} /><div><strong>先选旅行天数</strong><span>点击“生成清单”，就会从你现在拥有的单品里开始整理。</span></div></div>}
    </section>
  );
}

function ProfileModal({ onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="modal__header"><div><span className="eyebrow">YOUR PROFILE</span><h2 id="profile-title">Fang</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="关闭个人资料"><X size={20} /></button></div>
        <div className="profile-card"><div className="profile-card__avatar">F</div><div><strong>Fang's edit</strong><span>属于你的私人数字衣橱</span></div></div>
        <div className="profile-facts">
          <div><MapPin size={18} /><span>所在城市</span><strong>Los Angeles</strong></div>
          <div><TShirt size={18} /><span>身高体重</span><strong>170 cm · 70 kg</strong></div>
          <div><LockSimple size={18} /><span>数据方式</span><strong>本地保存 · 私密</strong></div>
          <div><ImageSquare size={18} /><span>生成准备</span><strong>模特参考照已就绪</strong></div>
        </div>
        <div className="modal__actions"><button type="button" className="button button--dark" onClick={onClose}>完成</button></div>
      </section>
    </div>
  );
}

function EmptyState({ onAction, title = "衣橱还是空的", description = "从一件你最常穿的单品开始，慢慢建立属于你的衣橱。", actionLabel = "添加第一件" }) {
  return <div className="empty-state"><div className="empty-state__icon"><TShirt size={28} /></div><h3>{title}</h3><p>{description}</p><button type="button" className="button button--dark" onClick={onAction}>{actionLabel.includes("添加") && <Plus size={17} />} {actionLabel}</button></div>;
}

export default function App() {
  const [items, setItems] = useState(readItems);
  const [activeView, setActiveView] = useState("home");
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [curatedOutfits, setCuratedOutfits] = useState([]);
  const [outfitFeedback, setOutfitFeedback] = useState(readOutfitFeedback);
  const [outfitRound, setOutfitRound] = useState(0);
  const [outfitSortMode, setOutfitSortMode] = useState("feedback");
  const [tripDays, setTripDays] = useState(3);
  const [packingRound, setPackingRound] = useState(0);
  const [packingItemIds, setPackingItemIds] = useState([]);
  const [packedIds, setPackedIds] = useState([]);
  const [focusSearch, setFocusSearch] = useState(false);
  const [toast, setToast] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const loadWardrobe = () => {
      const staticRecords = fetch(staticDataUrl("library.json"), { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("static wardrobe unavailable");
          return response.json();
        });
      const localRecords = fetch("/api/import/wardrobe", { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("wardrobe unavailable");
          return response.json();
        })
        .catch(() => null);
      Promise.all([staticRecords, localRecords])
        .then(([fallbackRecords, apiRecords]) => {
          const records = Array.isArray(apiRecords) && apiRecords.length ? apiRecords : fallbackRecords;
          if (!mounted || !Array.isArray(records)) return;
          const recordsWithAssets = records.map((record) => ({
            ...record,
            image: staticAssetUrl(record.image),
            thumbnail: staticAssetUrl(record.thumbnail),
            modeledImage: staticAssetUrl(record.modeledImage),
          }));
          setItems((currentItems) => {
            const merged = mergeImportedRecords(recordsWithAssets, currentItems);
            saveItems(merged);
            return merged;
          });
        })
        .catch(() => {});
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadWardrobe();
    };

    loadWardrobe();
    window.addEventListener("focus", loadWardrobe);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const refreshInterval = window.setInterval(loadWardrobe, 15000);
    return () => {
      mounted = false;
      window.removeEventListener("focus", loadWardrobe);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const staticFeedback = fetch(staticDataUrl("outfit-feedback.json"), { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("static outfit feedback unavailable");
        return response.json();
      })
      .catch(() => ({}));
    const localFeedback = fetch("/api/import/outfit-feedback", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("outfit feedback unavailable");
        return response.json();
      })
      .catch(() => null);
    Promise.all([staticFeedback, localFeedback]).then(([fallbackRecords, apiRecords]) => {
        const records = { ...fallbackRecords, ...(apiRecords || {}) };
        if (!mounted || !records || typeof records !== "object" || Array.isArray(records)) return;
        const merged = { ...readOutfitFeedback(), ...records };
        setOutfitFeedback(merged);
        localStorage.setItem(OUTFIT_FEEDBACK_STORAGE_KEY, JSON.stringify(merged));
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadOutfits = () => {
      const staticManifest = fetch(staticDataUrl("outfits.json"), { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("static outfits unavailable");
          return response.json();
        });
      const localManifest = fetch("/api/import/outfits", { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("outfits unavailable");
          return response.json();
        })
        .catch(() => null);
      Promise.all([staticManifest, localManifest]).then(([fallbackManifest, apiManifest]) => {
          const manifest = apiManifest || fallbackManifest;
          if (!mounted) return;
          const assetVersion = manifest?.assetVersion || "current";
          const acceptedOutfits = Array.isArray(manifest?.outfits) ? manifest.outfits.filter((outfit) => outfit.status === "accepted") : [];
          setCuratedOutfits(acceptedOutfits.map((outfit) => {
            const image = staticAssetUrl(outfit.image);
            return {
              ...outfit,
              image: image ? `${image}${image.includes("?") ? "&" : "?"}v=${encodeURIComponent(assetVersion)}` : image,
            };
          }));
        })
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadOutfits();
    };

    loadOutfits();
    window.addEventListener("focus", loadOutfits);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const refreshInterval = window.setInterval(loadOutfits, 15000);
    return () => {
      mounted = false;
      window.removeEventListener("focus", loadOutfits);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!focusSearch || activeView !== "collection") return undefined;
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusSearch(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, focusSearch]);

  const filteredItems = useMemo(() => items.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || `${item.name} ${item.categoryLabel} ${item.colorName || ""} ${item.tag || ""} ${(item.feedbackTags || []).join(" ")} ${item.feedbackNote || ""}`.toLowerCase().includes(search);
    return matchesCategory && matchesSearch && (!favoritesOnly || item.favorite);
  }), [items, activeCategory, query, favoritesOnly]);

  const favoriteItems = items.filter((item) => item.favorite);
  const mostWorn = [...items].sort((a, b) => b.wears - a.wears)[0];
  const feedbackInsight = useMemo(() => buildFeedbackInsight(items, outfitFeedback), [items, outfitFeedback]);
  const reviewedOutfitCount = curatedOutfits.filter((outfit) => hasLookFeedback(outfitFeedback[outfit.id])).length;
  const allOutfitsReviewed = curatedOutfits.length > 0 && reviewedOutfitCount === curatedOutfits.length;
  const visibleOutfitSortOptions = allOutfitsReviewed
    ? OUTFIT_SORT_OPTIONS.map((option) => option.id === "explore" ? { ...option, label: "探索未评价单品", description: `${curatedOutfits.length} 套搭配都已评价，改为优先展示包含未评价单品的组合。` } : option)
    : OUTFIT_SORT_OPTIONS;
  const visibleOutfitSortWeights = allOutfitsReviewed
    ? { ...OUTFIT_SORT_WEIGHTS, explore: [{ label: "未评价单品", value: 65 }, { label: "单品关系", value: 25 }, { label: "反馈差异", value: 10 }] }
    : OUTFIT_SORT_WEIGHTS;
  const outfitSuggestions = useMemo(() => {
    if (!curatedOutfits.length) return buildOutfits(items, outfitRound, outfitSortMode);
    const byId = new Map(items.map((item) => [item.id, item]));
    const mapped = curatedOutfits.map((outfit, index) => ({
      id: outfit.id,
      title: outfit.name,
      subtitle: outfit.reason || (outfit.occasion || []).join(" · "),
      reason: outfit.reason,
      items: (outfit.garmentIds || []).map((id) => byId.get(id)).filter(Boolean),
      image: outfit.image,
      feedback: outfitFeedback[outfit.id] || {},
      accent: index % 2 === 0 ? "terracotta" : "olive",
    })).filter((outfit) => outfit.items.length >= 2 && outfit.image);
    const ranked = sortOutfitCandidates(mapped, outfitSortMode);
    return rotateOutfitCandidates(ranked, outfitSortMode, outfitRound);
  }, [items, outfitRound, curatedOutfits, outfitFeedback, outfitSortMode]);
  const packingItems = useMemo(() => {
    const itemsById = new Map(items.map((item) => [item.id, item]));
    return packingItemIds.map((id) => itemsById.get(id)).filter(Boolean);
  }, [items, packingItemIds]);

  const showToast = (message) => setToast({ id: `${Date.now()}-${Math.random()}`, message });
  const updateItems = (next) => { setItems(next); saveItems(next); };
  const toggleFavorite = (id) => {
    const next = items.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item);
    updateItems(next);
    setSelectedItem((current) => current?.id === id ? { ...current, favorite: !current.favorite } : current);
  };
  const addItem = (form) => {
    const newItem = { id: `custom-${Date.now()}`, ...form, colorName: form.colorName || "自定义色", art: form.category === "shoes" ? "sneaker" : form.category === "bottom" ? "skirt" : form.category === "outer" ? "blazer" : form.category === "accessory" ? "bag" : "shirt", bg: "linen", favorite: false, wears: 0, lastWorn: "刚刚加入", tag: form.tag || "", rating: 0, feedbackTags: [], feedbackNote: "" };
    const next = [newItem, ...items];
    updateItems(next); setShowAdd(false); setActiveView("collection"); setActiveCategory("all"); showToast("已加入你的衣橱");
  };
  const saveEditedItem = async ({ id, name, category, color, colorName }) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const categoryLabel = CATEGORY_TABS.find((tab) => tab.id === category)?.label || "上衣";
    if (String(id).startsWith("import-")) {
      try {
        const response = await fetch(`/api/import/wardrobe/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, part: CATEGORY_TO_PART[category], color, colorName: colorName || null }),
        });
        if (!response.ok) throw new Error("update failed");
        const record = await response.json();
        const mapped = mapImportedItem(record);
        const updated = { ...current, ...mapped, favorite: current.favorite, wears: current.wears, lastWorn: current.lastWorn, tag: current.tag, rating: current.rating, feedbackTags: current.feedbackTags, feedbackNote: current.feedbackNote };
        updateItems(items.map((item) => item.id === id ? updated : item));
        setSelectedItem(updated);
        setShowEdit(false);
        showToast("修改已保存");
      } catch {
        showToast("暂时无法保存修改");
      }
      return;
    }
    const updated = { ...current, name, category, categoryLabel, color, colorName: colorName || colorLabel(name, color) };
    updateItems(items.map((item) => item.id === id ? updated : item));
    setSelectedItem(updated);
    setShowEdit(false);
    showToast("修改已保存");
  };
  const saveFeedback = async (id, feedback) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const normalized = {
      rating: Math.max(0, Math.min(5, Number(feedback.rating) || 0)),
      feedbackTags: [...new Set((feedback.feedbackTags || []).filter((tag) => FEEDBACK_TAGS.includes(tag)))].slice(0, 6),
      feedbackNote: String(feedback.feedbackNote || "").trim().slice(0, 500),
    };
    const localUpdated = { ...current, ...normalized };
    if (String(id).startsWith("import-")) {
      try {
        const response = await fetch(`/api/import/wardrobe/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalized),
        });
        if (!response.ok) throw new Error("feedback update failed");
        const record = await response.json();
        const mapped = mapImportedItem(record);
        const updated = { ...current, ...mapped, ...normalized, favorite: current.favorite, wears: current.wears, lastWorn: current.lastWorn, tag: current.tag };
        updateItems(items.map((item) => item.id === id ? updated : item));
        setSelectedItem(updated);
        showToast("评价已保存，之后会参考它来搭配");
      } catch {
        updateItems(items.map((item) => item.id === id ? localUpdated : item));
        setSelectedItem(localUpdated);
        showToast("评价已保存在本机，稍后再同步");
      }
      return;
    }
    updateItems(items.map((item) => item.id === id ? localUpdated : item));
    setSelectedItem(localUpdated);
    showToast("评价已保存");
  };
  const saveOutfitFeedback = async (id, feedback) => {
    const normalized = {
      rating: Math.max(0, Math.min(5, Number(feedback.rating) || 0)),
      feedbackTags: [...new Set((feedback.feedbackTags || []).filter((tag) => OUTFIT_FEEDBACK_TAGS.includes(tag)))].slice(0, 8),
      feedbackNote: String(feedback.feedbackNote || "").trim().slice(0, 500),
    };
    const next = { ...outfitFeedback, [id]: normalized };
    setOutfitFeedback(next);
    localStorage.setItem(OUTFIT_FEEDBACK_STORAGE_KEY, JSON.stringify(next));
    setSelectedOutfit((current) => current?.id === id ? { ...current, feedback: normalized } : current);
    try {
      const response = await fetch(`/api/import/outfit-feedback/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
      });
      if (!response.ok) throw new Error("outfit feedback update failed");
      showToast("这套搭配的评价已保存");
    } catch {
      showToast("评价已保存在本机，稍后再同步");
    }
  };
  const deleteItem = async (id) => {
    if (String(id).startsWith("import-")) {
      try {
        const response = await fetch(`/api/import/wardrobe/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("delete failed");
      } catch {
        showToast("暂时无法移除这件单品");
        return;
      }
    }
    updateItems(items.filter((item) => item.id !== id)); setSelectedItem(null); showToast("已从衣橱移除");
  };

  const openView = (id) => { setActiveView(id); if (id === "collection") setActiveCategory("all"); };
  const openSearch = () => {
    setActiveView("collection");
    setActiveCategory("all");
    setFavoritesOnly(false);
    setFocusSearch(true);
  };
  const reshuffleOutfits = () => {
    setOutfitRound((current) => current + 1);
    showToast(items.length ? "已从当前衣橱换了一批组合" : "先添加几件单品吧");
  };
  const changeTripDays = (value) => setTripDays(Math.min(14, Math.max(1, Number(value) || 1)));
  const generatePackingList = () => {
    const nextRound = packingRound + 1;
    const generated = buildPackingList(items, tripDays, nextRound);
    setPackingRound(nextRound);
    setPackingItemIds(generated.map((item) => item.id));
    setPackedIds([]);
    showToast(generated.length ? `已整理 ${generated.length} 件旅行单品` : "衣橱里还没有可装入的单品");
  };
  const togglePacked = (id) => setPackedIds((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  const pageTitle = activeView === "home" ? "今日衣橱" : activeView === "collection" ? "我的单品" : activeView === "outfits" ? "穿搭灵感" : "旅行行李";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">W</div><div><strong>衣橱</strong><span>MY WARDROBE</span></div></div>
        <button type="button" className="profile-chip" onClick={() => setShowProfile(true)} aria-label="打开 Fang 的个人资料"><div className="profile-avatar">F</div><div><strong>Fang's edit</strong><span>我的私人衣橱</span></div><DotsThree size={19} /></button>
        <nav className="main-nav" aria-label="主要导航">{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button className={activeView === id ? "active" : ""} type="button" key={id} onClick={() => openView(id)}><Icon size={18} weight={activeView === id ? "fill" : "regular"} /><span>{label}</span>{id === "outfits" && <span className="nav-dot" />}</button>)}</nav>
        <div className="sidebar-bottom"><div className="season-card"><div><span>当前季节</span><strong>初秋衣橱</strong></div><span className="season-symbol">✦</span></div><p className="sidebar-note">少一点拥有，<br />多一点喜欢。</p><div className="sidebar-footer"><span>LOCAL / PRIVATE</span><span>2026</span></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark">W</div><strong>衣橱</strong></div><div className="topbar__right"><button type="button" className="icon-button topbar-icon" onClick={openSearch} aria-label="搜索衣橱"><MagnifyingGlass size={19} /></button><button type="button" className="avatar-small" onClick={() => setShowProfile(true)} aria-label="打开个人资料">F</button></div></header>

        <div className="page-wrap">
          <div className="page-heading"><div><span className="eyebrow">{activeView === "home" ? "TUESDAY, AUGUST 04" : "YOUR PERSONAL EDIT"}</span><h1>{pageTitle}</h1></div><button type="button" className="button button--dark" onClick={() => setShowAdd(true)}><Plus size={17} /> 添加单品</button></div>

          {activeView === "home" && <>
            <section className="welcome-grid"><div className="welcome-copy"><div className="welcome-copy__mark">✳</div><span className="kicker">GOOD MORNING, FANG</span><h2>今天，<br /><em>穿什么？</em></h2><p>从你已有的衣橱里，找到今天的好心情。</p><button type="button" className="text-button" onClick={() => openView("outfits")}>看看今日穿搭 <CaretRight size={15} /></button></div><div className="weather-card"><div className="weather-card__head"><span>洛杉矶 · 今日参考</span><CloudSun size={24} weight="light" /></div><strong>约24°</strong><span className="weather-condition">晴朗偏干</span><div className="weather-card__bottom"><span>本地风格参考</span><span>适合轻薄层搭</span><span>非实时天气</span></div></div></section>
            <div className="stats-row"><Stat value={items.length} label="件单品" note="衣橱总数" /><Stat value={favoriteItems.length} label="件收藏" note="值得反复穿" /><Stat value={mostWorn ? mostWorn.wears : 0} label="次最高穿着" note={mostWorn ? mostWorn.name : "等待记录"} /><div className="stats-tip"><Sparkle size={18} /><span>你的衣橱<br /><strong>正在变得更懂你</strong></span><ArrowUpRight size={16} /></div></div>
            <section className="feedback-insight"><div><span className="kicker">WARDROBE SIGNAL</span><h3>{feedbackInsight.title}</h3><p>{feedbackInsight.description}</p></div><span className="feedback-insight__meta">{feedbackInsight.meta}</span></section>
          </>}

          {activeView === "packing" && <PackingPlanner items={items} days={tripDays} onDaysChange={changeTripDays} packingItems={packingItems} packedIds={packedIds} onGenerate={generatePackingList} onToggle={togglePacked} />}

          {(activeView === "home" || activeView === "collection") && <section className="collection-section">
            <div className="section-heading"><div><span className="kicker">{activeView === "home" ? "YOUR COLLECTION" : "ALL PIECES"}</span><h2>{activeView === "home" ? "最近加入的单品" : "我的全部单品"}</h2></div><div className="section-tools"><label className="search-field"><MagnifyingGlass size={16} /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索单品" aria-label="搜索单品" /></label><button type="button" className={`filter-button ${favoritesOnly ? "active" : ""}`} onClick={() => setFavoritesOnly((current) => !current)} aria-pressed={favoritesOnly} aria-label={favoritesOnly ? "取消只看收藏" : "只看收藏"} title={favoritesOnly ? "正在只看收藏" : "只看收藏"}><SlidersHorizontal size={17} /></button></div></div>
            <div className="category-row">{CATEGORY_TABS.map((tab) => <button type="button" key={tab.id} className={activeCategory === tab.id ? "active" : ""} onClick={() => setActiveCategory(tab.id)}>{tab.label}<span>{tab.id === "all" ? items.length : items.filter((item) => item.category === tab.id).length}</span></button>)}</div>
            {filteredItems.length ? <div className="item-grid">{filteredItems.map((item) => <ItemCard key={item.id} item={item} onOpen={setSelectedItem} onFavorite={toggleFavorite} />)}</div> : <EmptyState onAction={() => { if (favoritesOnly || query) { setFavoritesOnly(false); setQuery(""); } else setShowAdd(true); }} title={favoritesOnly ? "还没有符合条件的收藏" : query ? "没有找到匹配单品" : "衣橱还是空的"} description={favoritesOnly || query ? "清除筛选后，可以继续浏览你的全部衣橱。" : undefined} actionLabel={favoritesOnly || query ? "清除筛选" : "添加第一件"} />}
          </section>}

          {activeView === "outfits" && <section className="outfit-section">
            <div className="section-heading"><div><h2>搭配成品</h2></div><button type="button" className="text-button" onClick={reshuffleOutfits}>重新排序 <ArrowUpRight size={15} /></button></div>
            <div className="outfit-sort-panel">
              <div className="outfit-sort-panel__copy"><span className="kicker">当前排序</span><strong>{visibleOutfitSortOptions.find((option) => option.id === outfitSortMode)?.label}</strong><p>{visibleOutfitSortOptions.find((option) => option.id === outfitSortMode)?.description}</p></div>
              <div className="outfit-sort-options" role="tablist" aria-label="搭配排序方式">
                {visibleOutfitSortOptions.map((option) => <button key={option.id} type="button" role="tab" aria-selected={outfitSortMode === option.id} className={outfitSortMode === option.id ? "active" : ""} onClick={() => { setOutfitSortMode(option.id); setOutfitRound(0); }}>{option.label}</button>)}
              </div>
              <div className="outfit-sort-visual" aria-label="当前排序权重">
                {visibleOutfitSortWeights[outfitSortMode].map((weight) => <div className="outfit-sort-weight" key={weight.label}><div><span>{weight.label}</span><b>{weight.value}%</b></div><i><em style={{ width: `${weight.value}%` }} /></i></div>)}
              </div>
            </div>
            {outfitSuggestions.length ? <div className="outfit-grid">{outfitSuggestions.map((outfit, index) => <OutfitCard key={outfit.id} outfit={outfit} index={index} onOpen={setSelectedOutfit} />)}</div> : <EmptyState onAction={() => setShowAdd(true)} title="还没有可组合的单品" description="添加几件不同分类的单品，就能开始生成穿搭。" actionLabel="添加单品" />}
          </section>}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="移动导航">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => <button className={activeView === id ? "active" : ""} type="button" key={id} onClick={() => openView(id)}><Icon size={19} weight={activeView === id ? "fill" : "regular"} /><span>{label}</span></button>)}
      </nav>

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onAdd={addItem} />}
      {showEdit && selectedItem && <EditItemModal item={selectedItem} onClose={() => setShowEdit(false)} onSave={saveEditedItem} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {selectedOutfit && <OutfitDetailModal outfit={selectedOutfit} onClose={() => setSelectedOutfit(null)} onSaveFeedback={saveOutfitFeedback} />}
      <DetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} onFavorite={toggleFavorite} onDelete={deleteItem} onEdit={() => setShowEdit(true)} onSaveFeedback={saveFeedback} />
      {toast && <div className="toast" role="status"><Check size={16} weight="bold" /> {toast.message}</div>}
    </div>
  );
}
