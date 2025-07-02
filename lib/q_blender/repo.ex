defmodule QBlender.Repo do
  use Ecto.Repo,
    otp_app: :q_blender,
    adapter: Ecto.Adapters.Postgres
end
