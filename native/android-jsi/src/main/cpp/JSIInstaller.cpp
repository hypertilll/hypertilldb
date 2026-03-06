
#include <jni.h>
#include <jsi/jsi.h>

#include "Database.h"
#include "DatabasePlatformAndroid.h"

using namespace facebook;

extern "C" JNIEXPORT void JNICALL Java_com_hypertill_db_jsi_JSIInstaller_installBinding(JNIEnv *env, jobject thiz, jlong runtimePtr) {
    jsi::Runtime *runtime = (jsi::Runtime *)runtimePtr;
    assert(runtime != nullptr);
    hypertilldb::platform::configureJNI(env);
    hypertilldb::Database::install(runtime);
}

extern "C" JNIEXPORT void JNICALL Java_com_hypertill_db_jsi_JSIInstaller_provideSyncJson(JNIEnv *env, jclass clazz, jint id, jbyteArray array) {
    hypertilldb::platform::provideJson(id, array);
}

extern "C" JNIEXPORT void JNICALL Java_com_hypertill_db_jsi_JSIInstaller_destroy(JNIEnv *env, jclass clazz) {
    hypertilldb::platform::destroy();
}
