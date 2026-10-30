require 'open3'
require 'timeout'
require 'tempfile'

class JrcVoiceQuality::AudioInput
  MAX_BYTES = 25.megabytes

  def self.open(source)
    Tempfile.create(['jrc-vocal-', '.mp3']) do |output|
      convert(source.path, output.path)
      if File.empty?(output.path) || File.size(output.path) > MAX_BYTES
        raise JrcVoiceQuality::AnalysisError.new('Áudio normalizado excede o limite da avaliação vocal.', code: :vocal_audio_limit)
      end

      yield output.path
    end
  end

  def self.convert(source_path, output_path)
    args = ['ffmpeg', '-nostdin', '-y', '-v', 'error', '-threads', '1', '-i', source_path,
            '-map', '0:a:0', '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '64k',
            '-fs', (MAX_BYTES + 1).to_s, output_path]
    Open3.popen2(*args, pgroup: true, err: File::NULL, out: File::NULL) do |input, output, process|
      input.close
      output.close
      begin
        status = Timeout.timeout(120) { process.value }
        raise JrcVoiceQuality::AnalysisError.new('Não foi possível preparar o áudio.', code: :vocal_audio_invalid) unless status.success?
      rescue Timeout::Error
        Process.kill('KILL', -process.pid)
        process.value
        raise JrcVoiceQuality::AnalysisError.new('Tempo limite ao preparar o áudio.', code: :vocal_audio_invalid)
      end
    end
  rescue Errno::ENOENT
    raise JrcVoiceQuality::ConfigurationError.new('Conversor de áudio indisponível no worker.', code: :vocal_converter_missing)
  end
end
