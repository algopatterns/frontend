'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { SAMPLE_DATA, ALL_SAMPLES } from '@/lib/data/samples';
import { useSamplesPanel } from './hooks';
import { SampleItem, CategorySection, SubCategorySection } from './components';

export function SamplesPanel() {
  const {
    searchQuery,
    setSearchQuery,
    openCategories,
    toggleCategory,
    searchResults,
  } = useSamplesPanel();

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <h2 className="font-medium text-sm">Samples</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search samples..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchQuery && searchResults ? (
          <div className="p-2 space-y-0.5">
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No samples found
              </p>
            ) : (
              <>
                {searchResults.map(sample => (
                  <SampleItem key={sample} name={sample} />
                ))}
                {ALL_SAMPLES.filter(s =>
                  s.toLowerCase().includes(searchQuery.toLowerCase())
                ).length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Showing first 50 results. Refine your search for more.
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <CategorySection
              title="Samples"
              samples={SAMPLE_DATA.samples}
              isOpen={openCategories.has('samples')}
              onToggle={() => toggleCategory('samples')}
              searchQuery={searchQuery}
            />
            <SubCategorySection
              title="Drum Machines"
              data={SAMPLE_DATA.drums}
              defaultOpen="Basic"
              isOpen={openCategories.has('drums')}
              onToggle={() => toggleCategory('drums')}
              searchQuery={searchQuery}
            />
            <SubCategorySection
              title="Synths"
              data={SAMPLE_DATA.synths}
              defaultOpen="Basic Waveforms"
              isOpen={openCategories.has('synths')}
              onToggle={() => toggleCategory('synths')}
              searchQuery={searchQuery}
            />
            <CategorySection
              title="Wavetables"
              samples={SAMPLE_DATA.wavetables}
              isOpen={openCategories.has('wavetables')}
              onToggle={() => toggleCategory('wavetables')}
              searchQuery={searchQuery}
            />
          </>
        )}
      </div>

      <div className="px-3 py-2 border-t h-footer flex items-center justify-center">
        <div className="flex items-center gap-4 opacity-80">
          <a
            href="https://github.com/algoraveai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            GITHUB
          </a>

          <a
            href="https://github.com/algoraveai/server/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            AGPL-V3
          </a>

          <a
            href="https://strudel.cc/workshop/getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            STRUDEL
          </a>
        </div>
      </div>
    </div>
  );
}
