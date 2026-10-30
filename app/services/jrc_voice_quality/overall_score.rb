class JrcVoiceQuality::OverallScore
  WEIGHTS = { 'qualidade' => 60, 'positivos' => 15, 'negativos' => 10, 'resolucao' => 10, 'evolucao' => 5 }.freeze
  RESOLUTION = { 'resolvido' => 10, 'parcialmente_resolvido' => 6, 'encaminhado' => 4, 'nao_resolvido' => 0 }.freeze
  EVOLUTION = { 'melhorou' => 10, 'estavel' => 5, 'mista' => 5, 'piorou' => 0 }.freeze

  def initialize(result)
    @result = result
    @profile = result.fetch('perfil_emocional')
  end

  def call
    groups = build_groups
    items = groups.flat_map { |group| group['indicadores'] }
    evaluated = items.reject { |item| item['nota'].nil? }
    weight = evaluated.sum { |item| item['peso'] }
    points = evaluated.sum { |item| item['pontos'] }.round(2)
    {
      'versao' => 1, 'nota' => weight.positive? ? (points * 100 / weight).round(2) : nil,
      'peso_avaliado' => weight, 'peso_total' => 100, 'pontos_obtidos' => points, 'parcial' => weight < 100,
      'grupos' => groups,
      'mais_contribuiram' => ranked(evaluated, 'pontos'),
      'mais_reduziram' => ranked(evaluated, 'pontos_perdidos')
    }
  end

  def self.apply(result)
    score = new(result).call
    classification = score['nota'].nil? ? 'nao_avaliada' : classification(score['nota'])
    result.merge('pontuacao_geral' => score, 'nota_final' => score['nota'], 'classificacao_ligacao' => classification,
                 'status_monitoria' => score['nota'].nil? ? 'nao_avaliada' : status(score['nota'], result['alerta_supervisao']))
  end

  def self.classification(score)
    return 'excelente' if score >= 90
    return 'boa' if score >= 75
    return 'regular' if score >= 60
    return 'ruim' if score >= 40

    'critica'
  end

  def self.status(score, alert)
    return 'critica_para_supervisao' if alert || score < 40
    return 'aprovada' if score >= 75
    return 'aprovada_com_observacao' if score >= 60

    'reprovada'
  end

  private

  def build_groups
    positive = @profile.fetch('positivos').merge('sorriso_na_voz' => @result.dig('analise_vocal', 'sorriso_na_voz'))
    rows = {
      'qualidade' => [quality_item],
      'positivos' => metric_items(JrcVoiceQuality::EmotionalProfile::POSITIVE + ['sorriso_na_voz'], positive, 'positivos'),
      'negativos' => metric_items(JrcVoiceQuality::EmotionalProfile::NEGATIVE, @profile.fetch('negativos'), 'negativos'),
      'resolucao' => [context_item('resolucao', RESOLUTION, 'situacao')],
      'evolucao' => [context_item('evolucao', EVOLUTION, 'resultado')]
    }
    rows.map do |id, items|
      evaluated = items.reject { |item| item['nota'].nil? }
      { 'id' => id, 'peso' => WEIGHTS.fetch(id), 'peso_avaliado' => evaluated.sum { |item| item['peso'] },
        'pontos' => evaluated.sum { |item| item['pontos'] }.round(2), 'indicadores' => items }
    end
  end

  def quality_item
    metric = { 'nota' => @result.dig('avaliacao_atendente', 'nota_final'),
               'observacao' => @result['justificativa_nota'], 'evidencias' => Array(@result['trechos_relevantes']).grep(String) }
    item('qualidade', 'qualidade', metric, scale: 100)
  end

  def metric_items(names, metrics, group)
    names.map { |name| item(name, group, metrics[name] || {}, count: names.size) }
  end

  def context_item(group, mapping, state)
    context = @profile.fetch(group)
    evidence = context['evidencias'] || context.values_at('inicio', 'meio', 'fim').flat_map { |phase| phase.fetch('evidencias') }
    item(group, group, { 'nota' => mapping[context.fetch(state)], 'observacao' => context['justificativa'], 'evidencias' => evidence })
  end

  def item(id, group, metric, scale: 10, count: 1)
    note = metric['nota']
    weight = WEIGHTS.fetch(group).to_f / count
    normalized = group == 'negativos' && !note.nil? ? scale - note : note
    points = normalized.nil? ? nil : (normalized.to_f / scale * weight).round(2)
    {
      'id' => id, 'grupo' => group, 'nota' => note, 'escala' => scale, 'peso' => weight, 'pontos' => points,
      'pontos_perdidos' => points.nil? ? nil : (weight - points).round(2),
      'observacao' => metric['observacao'].to_s, 'evidencias' => metric['evidencias'] || [],
      'fonte' => id == 'sorriso_na_voz' ? 'audio' : 'transcricao'
    }
  end

  def ranked(items, field)
    items.select { |item| item[field].positive? }.sort_by { |item| -item[field] }.first(3).pluck('id')
  end
end
