'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { SAMPLE_DATA } from '@/lib/data/samples';
import { useSamplesPanel } from './hooks';
import { SampleItem, CategorySection, SubCategorySection } from './components';

export function SamplesPanel() {
  const { searchQuery, setSearchQuery, openCategories, toggleCategory, searchResults } =
    useSamplesPanel();

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
              </>
            )}
          </div>
        ) : (
          <>
            <CategorySection
              title="Basic Drums"
              samples={SAMPLE_DATA.basicDrums}
              isOpen={openCategories.has('basicDrums')}
              onToggle={() => toggleCategory('basicDrums')}
              searchQuery={searchQuery}
            />
            <CategorySection
              title="Orchestral (VCSL)"
              samples={SAMPLE_DATA.vcsl}
              isOpen={openCategories.has('vcsl')}
              onToggle={() => toggleCategory('vcsl')}
              searchQuery={searchQuery}
            />
            <SubCategorySection
              title="Drum Machines"
              data={SAMPLE_DATA.drumMachines}
              defaultOpen="Roland TR-808"
              isOpen={openCategories.has('drumMachines')}
              onToggle={() => toggleCategory('drumMachines')}
              searchQuery={searchQuery}
            />
            <SubCategorySection
              title="Synths"
              data={SAMPLE_DATA.synths}
              defaultOpen="Waveforms"
              isOpen={openCategories.has('synths')}
              onToggle={() => toggleCategory('synths')}
              searchQuery={searchQuery}
            />
            <SubCategorySection
              title="GM Soundfonts"
              data={SAMPLE_DATA.gmSoundfonts}
              defaultOpen="Piano/Keys"
              isOpen={openCategories.has('gmSoundfonts')}
              onToggle={() => toggleCategory('gmSoundfonts')}
              searchQuery={searchQuery}
            />
            <CategorySection
              title="Dirt Samples"
              samples={SAMPLE_DATA.dirtSamples}
              isOpen={openCategories.has('dirtSamples')}
              onToggle={() => toggleCategory('dirtSamples')}
              searchQuery={searchQuery}
            />
            <CategorySection
              title="Piano"
              samples={SAMPLE_DATA.piano}
              isOpen={openCategories.has('piano')}
              onToggle={() => toggleCategory('piano')}
              searchQuery={searchQuery}
            />
          </>
        )}
      </div>

    </div>
  );
}
