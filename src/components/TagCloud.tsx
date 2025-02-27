import React from 'react';
import { TagsResult } from '@/src/types/types';
import { classifyTag } from '../services/tagClassification';

interface TagCloudProps {
  allTags: TagsResult[];
  onTagClick: (tag: string) => void;
  selectedTags: string[];
}

export const TagCloud: React.FC<TagCloudProps> = ({
  allTags,
  onTagClick,
  selectedTags
}) => {
  // すべての商品のタグを集計
  const tagCount = React.useMemo(() => {
    const count = new Map<string, number>();
    
    allTags.forEach(tagResult => {
      const { 焙煎度タグ, 風味タグ, 特徴タグ } = tagResult;
      [焙煎度タグ, 風味タグ, 特徴タグ].forEach(tagArray => {
        tagArray.forEach((tag: string) => {
          count.set(tag, (count.get(tag) || 0) + 1);
        });
      });
    });
    
    return count;
  }, [allTags]);

  // タグの種類を判定（キャッシュ付き）
  const tagCategoryCache = React.useRef(new Map<string, '焙煎度' | '風味' | '特徴'>());
  
  const getTagCategory = React.useCallback(async (tag: string): Promise<'焙煎度' | '風味' | '特徴'> => {
    // キャッシュをチェック
    if (tagCategoryCache.current.has(tag)) {
      return tagCategoryCache.current.get(tag)!;
    }
    
    // 新しい分類システムを使用
    const result = await classifyTag(tag, true);
    tagCategoryCache.current.set(tag, result.category);
    return result.category;
  }, []);

  // グループ化されたタグを管理するstate
  const [groupedTags, setGroupedTags] = React.useState<{
    焙煎度: [string, number][];
    風味: [string, number][];
    特徴: [string, number][];
  }>({
    焙煎度: [],
    風味: [],
    特徴: []
  });

  // タグの分類を実行
  React.useEffect(() => {
    const classifyTags = async () => {
      const groups = {
        焙煎度: [] as [string, number][],
        風味: [] as [string, number][],
        特徴: [] as [string, number][]
      };

      for (const [tag, count] of Array.from(tagCount.entries())) {
        const category = await getTagCategory(tag);
        groups[category].push([tag, count]);
      }

      // 各グループ内でカウント数でソート
      Object.keys(groups).forEach(key => {
        groups[key as keyof typeof groups].sort((a, b) => b[1] - a[1]);
      });

      setGroupedTags(groups);
    };

    classifyTags();
  }, [tagCount, getTagCategory]);

  // タグの種類ごとの背景色を定義
  const getTagStyle = (tag: string, category: '焙煎度' | '風味' | '特徴') => {
    const isSelected = selectedTags.includes(tag);
    const baseStyle = "px-3 py-1 rounded-full cursor-pointer transition-all";
    
    switch (category) {
      case '焙煎度':
        if (tag.includes('浅煎り') || tag.startsWith('#Lv1') || tag.startsWith('#Lv2')) {
          return isSelected ? "bg-brown-400 text-white " + baseStyle : "bg-brown-100 text-brown-800 hover:bg-brown-200 " + baseStyle;
        }
        if (tag.includes('中煎り') || tag.startsWith('#Lv3') || tag.startsWith('#Lv4') || tag.startsWith('#Lv5')) {
          return isSelected ? "bg-brown-600 text-white " + baseStyle : "bg-brown-200 text-brown-800 hover:bg-brown-300 " + baseStyle;
        }
        if (tag.includes('深煎り') || tag.startsWith('#Lv6') || tag.startsWith('#Lv7') || tag.startsWith('#Lv8')) {
          return isSelected ? "bg-brown-800 text-white " + baseStyle : "bg-brown-300 text-brown-800 hover:bg-brown-400 " + baseStyle;
        }
        return isSelected ? "bg-brown-600 text-white " + baseStyle : "bg-brown-200 text-brown-800 hover:bg-brown-300 " + baseStyle;
      case '風味':
        return isSelected ? "bg-yellow-600 text-white " + baseStyle : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 " + baseStyle;
      case '特徴':
        return isSelected ? "bg-green-600 text-white " + baseStyle : "bg-green-100 text-green-800 hover:bg-green-200 " + baseStyle;
      default:
        return isSelected ? "bg-gray-600 text-white " + baseStyle : "bg-gray-100 text-gray-800 hover:bg-gray-200 " + baseStyle;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">タグで探す</h2>
      
      {/* 焙煎度タグ */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">焙煎度</h3>
        <div className="flex flex-wrap gap-2">
          {groupedTags.焙煎度.map(([tag, count]) => (
            <span
              key={tag}
              className={getTagStyle(tag, '焙煎度')}
              onClick={() => onTagClick(tag)}
            >
              {tag} ({count})
            </span>
          ))}
        </div>
      </div>

      {/* 風味タグ */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">風味</h3>
        <div className="flex flex-wrap gap-2">
          {groupedTags.風味.map(([tag, count]) => (
            <span
              key={tag}
              className={getTagStyle(tag, '風味')}
              onClick={() => onTagClick(tag)}
            >
              {tag} ({count})
            </span>
          ))}
        </div>
      </div>

      {/* 特徴タグ */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">特徴</h3>
        <div className="flex flex-wrap gap-2">
          {groupedTags.特徴.map(([tag, count]) => (
            <span
              key={tag}
              className={getTagStyle(tag, '特徴')}
              onClick={() => onTagClick(tag)}
            >
              {tag} ({count})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}; 