// Sample data organized by category matching strudel.cc structure
// This includes commonly used samples - the full list is available at strudel.cc/learn/samples

export const SAMPLE_DATA = {
  samples: [
    "agogo", "anvil", "balafon", "balafon_hard", "balafon_soft", "ballwhistle", "bassdrum1", "bassdrum2",
    "belltree", "bongo", "brakedrum", "cabasa", "cajon", "casio", "clap", "clash", "clash2", "clave",
    "clavisynth", "conga", "cowbell", "crow", "dantranh", "dantranh_tremolo", "dantranh_vibrato", "darbuka",
    "didgeridoo", "east", "fingercymbal", "flexatone", "fmpiano", "folkharp", "framedrum", "glockenspiel",
    "gong", "gong2", "guiro", "handbells", "handchimes", "harmonica", "harmonica_soft", "harmonica_vib",
    "harp", "hihat", "insect", "jazz", "kalimba", "kalimba2", "kalimba3", "kalimba4", "kalimba5", "kawai",
    "marimba", "marktrees", "metal", "num", "numbers", "ocarina", "ocarina_small", "ocarina_small_stacc",
    "ocarina_vib", "oceandrum", "organ_4inch", "organ_8inch", "organ_full", "piano", "piano1",
    "pipeorgan_loud", "pipeorgan_loud_pedal", "pipeorgan_quiet", "pipeorgan_quiet_pedal", "psaltery_bow",
    "psaltery_pluck", "psaltery_spiccato", "ratchet", "recorder_alto_stacc", "recorder_alto_sus",
    "recorder_alto_vib", "recorder_bass_stacc", "recorder_bass_sus", "recorder_bass_vib",
    "recorder_soprano_stacc", "recorder_soprano_sus", "recorder_tenor_stacc", "recorder_tenor_sus",
    "recorder_tenor_vib", "sax", "sax_stacc", "sax_vib", "saxello", "saxello_stacc", "saxello_vib",
    "shaker_large", "shaker_small", "siren", "slapstick", "sleighbells", "slitdrum", "snare_hi",
    "snare_low", "snare_modern", "snare_rim", "space", "steinway", "strumstick", "super64", "super64_acc",
    "super64_vib", "sus_cymbal", "sus_cymbal2", "tambourine", "tambourine2", "timpani", "timpani_roll",
    "timpani2", "tom_mallet", "tom_rim", "tom_stick", "tom2_mallet", "tom2_rim", "tom2_stick",
    "trainwhistle", "triangles", "tubularbells", "tubularbells2", "vibraphone", "vibraphone_bowed",
    "vibraphone_soft", "vibraslap", "wind", "wineglass", "wineglass_slow", "woodblock", "xylophone_hard_ff",
    "xylophone_hard_pp", "xylophone_medium_ff", "xylophone_medium_pp", "xylophone_soft_ff", "xylophone_soft_pp"
  ],
  drums: {
    "Basic": ["bd", "sd", "hh", "oh", "cp", "lt", "mt", "ht", "rs", "cb", "cy", "rim", "cr", "rd", "tb", "sh", "misc"],
    "TR-808": ["tr808_bd", "tr808_sd", "tr808_hh", "tr808_oh", "tr808_cp", "tr808_ht", "tr808_lt", "tr808_mt", "tr808_cb", "tr808_cr", "tr808_rim", "tr808_sh", "tr808_perc"],
    "TR-909": ["tr909_bd", "tr909_sd", "tr909_hh", "tr909_oh", "tr909_cp", "tr909_ht", "tr909_lt", "tr909_mt", "tr909_rd", "tr909_rim", "tr909_cr"],
    "TR-606": ["tr606_bd", "tr606_sd", "tr606_hh", "tr606_oh", "tr606_ht", "tr606_lt", "tr606_cr"],
    "TR-707": ["tr707_bd", "tr707_sd", "tr707_hh", "tr707_oh", "tr707_cp", "tr707_ht", "tr707_lt", "tr707_mt", "tr707_cb", "tr707_rim", "tr707_tb"],
    "TR-505": ["tr505_bd", "tr505_sd", "tr505_hh", "tr505_oh", "tr505_cp", "tr505_ht", "tr505_lt", "tr505_mt", "tr505_cb", "tr505_cr", "tr505_rd", "tr505_rim", "tr505_perc"],
    "TR-626": ["tr626_bd", "tr626_sd", "tr626_hh", "tr626_oh", "tr626_cp", "tr626_ht", "tr626_lt", "tr626_mt", "tr626_cb", "tr626_cr", "tr626_rd", "tr626_rim", "tr626_perc", "tr626_sh", "tr626_tb"],
    "TR-727": ["tr727_perc", "tr727_sh"],
    "LinnDrum": ["linndrum_bd", "linndrum_sd", "linndrum_hh", "linndrum_oh", "linndrum_cp", "linndrum_ht", "linndrum_lt", "linndrum_mt", "linndrum_cb", "linndrum_cr", "linndrum_rd", "linndrum_rim", "linndrum_sh", "linndrum_tb", "linndrum_perc"],
    "LM-1": ["lm1_bd", "lm1_sd", "lm1_hh", "lm1_oh", "lm1_cp", "lm1_ht", "lm1_lt", "lm1_cb", "lm1_rim", "lm1_sh", "lm1_tb", "lm1_perc"],
    "LM-2": ["lm2_bd", "lm2_sd", "lm2_hh", "lm2_oh", "lm2_cp", "lm2_ht", "lm2_lt", "lm2_mt", "lm2_cr", "lm2_rd", "lm2_rim", "lm2_sh", "lm2_tb"],
    "DMX": ["dmx_bd", "dmx_sd", "dmx_hh", "dmx_oh", "dmx_cp", "dmx_ht", "dmx_lt", "dmx_mt", "dmx_cr", "dmx_rd", "dmx_rim", "dmx_sh", "dmx_tb"],
    "SP-12": ["sp12_bd", "sp12_sd", "sp12_hh", "sp12_oh", "sp12_cp", "sp12_ht", "sp12_lt", "sp12_mt", "sp12_cb", "sp12_cr", "sp12_rd", "sp12_rim", "sp12_misc", "sp12_perc"],
    "MPC-60": ["mpc60_bd", "mpc60_sd", "mpc60_hh", "mpc60_oh", "mpc60_cp", "mpc60_ht", "mpc60_lt", "mpc60_mt", "mpc60_cr", "mpc60_rd", "mpc60_rim", "mpc60_misc", "mpc60_perc"],
    "HR-16": ["hr16_bd", "hr16_sd", "hr16_hh", "hr16_oh", "hr16_cp", "hr16_ht", "hr16_lt", "hr16_rim", "hr16_sh", "hr16_perc"],
    "SR-16": ["sr16_bd", "sr16_sd", "sr16_hh", "sr16_oh", "sr16_cp", "sr16_cr", "sr16_rd", "sr16_rim", "sr16_sh", "sr16_tb", "sr16_misc", "sr16_perc"],
  },
  synths: {
    "Basic Waveforms": ["sawtooth", "saw", "sine", "sin", "square", "sqr", "triangle", "tri", "pulse", "white", "pink", "brown"],
    "Noise & FX": ["bytebeat", "crackle", "supersaw", "user", "zzfx"],
    "Z Series": ["z_noise", "z_sawtooth", "z_sine", "z_square", "z_tan", "z_triangle"],
    "GM Piano/Keys": ["gm_piano", "gm_epiano1", "gm_epiano2", "gm_harpsichord", "gm_clavinet", "gm_celesta", "gm_music_box", "gm_glockenspiel", "gm_vibraphone", "gm_marimba", "gm_xylophone", "gm_tubular_bells", "gm_dulcimer"],
    "GM Organ": ["gm_drawbar_organ", "gm_percussive_organ", "gm_rock_organ", "gm_church_organ", "gm_reed_organ", "gm_accordion", "gm_harmonica", "gm_bandoneon"],
    "GM Guitar": ["gm_acoustic_guitar_nylon", "gm_acoustic_guitar_steel", "gm_electric_guitar_jazz", "gm_electric_guitar_clean", "gm_electric_guitar_muted", "gm_overdriven_guitar", "gm_distortion_guitar", "gm_guitar_harmonics", "gm_guitar_fret_noise"],
    "GM Bass": ["gm_acoustic_bass", "gm_electric_bass_finger", "gm_electric_bass_pick", "gm_fretless_bass", "gm_slap_bass_1", "gm_slap_bass_2", "gm_synth_bass_1", "gm_synth_bass_2"],
    "GM Strings": ["gm_violin", "gm_viola", "gm_cello", "gm_contrabass", "gm_tremolo_strings", "gm_pizzicato_strings", "gm_orchestral_harp", "gm_timpani", "gm_string_ensemble_1", "gm_string_ensemble_2", "gm_synth_strings_1", "gm_synth_strings_2", "gm_fiddle"],
    "GM Brass": ["gm_trumpet", "gm_trombone", "gm_tuba", "gm_muted_trumpet", "gm_french_horn", "gm_brass_section", "gm_synth_brass_1", "gm_synth_brass_2"],
    "GM Woodwind": ["gm_soprano_sax", "gm_alto_sax", "gm_tenor_sax", "gm_baritone_sax", "gm_oboe", "gm_english_horn", "gm_bassoon", "gm_clarinet", "gm_piccolo", "gm_flute", "gm_recorder", "gm_pan_flute", "gm_blown_bottle", "gm_shakuhachi", "gm_whistle", "gm_ocarina"],
    "GM Ethnic": ["gm_sitar", "gm_banjo", "gm_shamisen", "gm_koto", "gm_kalimba", "gm_bagpipe", "gm_shanai", "gm_steel_drums", "gm_agogo", "gm_woodblock", "gm_taiko_drum", "gm_melodic_tom"],
    "GM Lead": ["gm_lead_1_square", "gm_lead_2_sawtooth", "gm_lead_3_calliope", "gm_lead_4_chiff", "gm_lead_5_charang", "gm_lead_6_voice", "gm_lead_7_fifths", "gm_lead_8_bass_lead"],
    "GM Pad": ["gm_pad_new_age", "gm_pad_warm", "gm_pad_poly", "gm_pad_choir", "gm_pad_bowed", "gm_pad_metallic", "gm_pad_halo", "gm_pad_sweep"],
    "GM FX": ["gm_fx_rain", "gm_fx_soundtrack", "gm_fx_crystal", "gm_fx_atmosphere", "gm_fx_brightness", "gm_fx_goblins", "gm_fx_echoes", "gm_fx_sci_fi"],
    "GM Choir/Voice": ["gm_choir_aahs", "gm_voice_oohs", "gm_synth_choir"],
    "GM SFX": ["gm_synth_drum", "gm_reverse_cymbal", "gm_breath_noise", "gm_seashore", "gm_bird_tweet", "gm_telephone", "gm_helicopter", "gm_applause", "gm_gunshot", "gm_orchestra_hit", "gm_tinkle_bell"],
  },
  wavetables: ["wt_digital", "wt_digital_bad_day", "wt_digital_basique", "wt_digital_crickets", "wt_digital_curses", "wt_digital_echoes", "wt_vgame"],
} as const;

// Flatten drum samples for searching
export const ALL_DRUM_SAMPLES = Object.values(SAMPLE_DATA.drums).flat();

// Flatten synth samples for searching
export const ALL_SYNTH_SAMPLES = Object.values(SAMPLE_DATA.synths).flat();

// All samples combined for search
export const ALL_SAMPLES = [
  ...SAMPLE_DATA.samples,
  ...ALL_DRUM_SAMPLES,
  ...ALL_SYNTH_SAMPLES,
  ...SAMPLE_DATA.wavetables,
];

// Type exports
export type DrumCategory = keyof typeof SAMPLE_DATA.drums;
export type SynthCategory = keyof typeof SAMPLE_DATA.synths;
export type SampleCategory = keyof typeof SAMPLE_DATA;
